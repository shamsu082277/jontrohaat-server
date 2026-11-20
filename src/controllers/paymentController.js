import { getDatabase, getMongoClient } from "../config/db.js";
import { env } from "../config/env.js";
import { getStripe } from "../config/stripe.js";
import { HttpError, success } from "../utils/http.js";
import { toObjectId } from "../utils/objectId.js";

function amountInMinorUnits(amount) {
  return Math.round(amount * 100);
}

async function applySessionResult(session, verifiedStatus) {
  const db = getDatabase();
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) throw new HttpError(400, "Checkout session has no booking reference");
  const bookingObjectId = toObjectId(bookingId, "booking id");
  const booking = await db.collection("bookings").findOne({ _id: bookingObjectId });
  if (!booking) throw new HttpError(404, "Booking not found");
  const currency = env.STRIPE_CURRENCY.toLowerCase();
  if (session.currency?.toLowerCase() !== currency || session.amount_total !== amountInMinorUnits(booking.totalAmount)) {
    throw new HttpError(400, "Stripe session amount or currency does not match the booking");
  }
  if (booking.stripeSessionId && booking.stripeSessionId !== session.id) throw new HttpError(409, "Stripe session does not match this booking");

  const now = new Date();
  if (String(session.metadata?.customerId) !== String(booking.customerId)) {
    throw new HttpError(400, "Stripe session customer does not match the booking");
  }
  const paymentStatus = verifiedStatus;
  const client = getMongoClient();
  const mongoSession = client.startSession();
  try {
    await mongoSession.withTransaction(async () => {
      await db.collection("payments").updateOne(
        { stripeSessionId: session.id },
        [{
          $set: {
            bookingId: { $ifNull: ["$bookingId", { $literal: booking._id }] },
            customerId: { $ifNull: ["$customerId", { $literal: booking.customerId }] },
            stripeSessionId: { $literal: session.id },
            stripePaymentIntentId: { $literal: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null },
            amount: { $literal: booking.totalAmount },
            currency: { $literal: currency },
            status: { $cond: [{ $eq: ["$status", "paid"] }, "paid", { $literal: paymentStatus }] },
            createdAt: { $ifNull: ["$createdAt", { $literal: now }] },
            updatedAt: { $literal: now },
          },
        }],
        { upsert: true, session: mongoSession }
      );
      if (verifiedStatus !== "pending") {
        await db.collection("bookings").updateOne(
          { _id: booking._id, stripeSessionId: { $in: [null, session.id] }, bookingStatus: "pending" },
          {
            $set: {
              stripeSessionId: session.id,
              paymentStatus,
              bookingStatus: verifiedStatus === "paid" ? "confirmed" : "cancelled",
              reservationReleased: verifiedStatus !== "paid",
              updatedAt: now,
            },
          },
          { session: mongoSession }
        );
      }
    });
  } finally {
    await mongoSession.endSession();
  }
  return { bookingId: String(booking._id), paid: verifiedStatus === "paid", amount: booking.totalAmount };
}

export async function createCheckoutSession(req, res) {
  const db = getDatabase();
  const bookingId = toObjectId(req.body.bookingId, "booking id");
  const booking = await db.collection("bookings").findOne({ _id: bookingId, customerId: req.user.mongoId });
  if (!booking) throw new HttpError(404, "Booking not found");
  if (booking.paymentStatus === "paid" || booking.bookingStatus !== "pending" || booking.expiresAt <= new Date()) {
    throw new HttpError(409, "Booking is not eligible for payment");
  }

  const stripe = getStripe();
  if (booking.stripeSessionId) {
    const previous = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
    if (previous.status === "open" && previous.url) {
      return success(res, "Existing checkout session retrieved", { checkoutUrl: previous.url, sessionId: previous.id });
    }
    throw new HttpError(409, "The booking payment session has expired; create a new booking");
  }

  const frontend = env.CLIENT_URL.split(",")[0].trim().replace(/\/$/, "");
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: env.STRIPE_CURRENCY.toLowerCase(),
    line_items: [{
      quantity: 1,
      price_data: {
        currency: env.STRIPE_CURRENCY.toLowerCase(),
        unit_amount: amountInMinorUnits(booking.totalAmount),
        product_data: { name: `Equipment rental booking ${String(booking._id)}` },
      },
    }],
    metadata: { bookingId: String(booking._id), customerId: String(req.user.mongoId) },
    client_reference_id: String(booking._id),
    success_url: `${frontend}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontend}/payment/cancel?booking_id=${booking._id}`,
    expires_at: Math.floor(booking.expiresAt.getTime() / 1000),
  }, { idempotencyKey: `booking-checkout-${booking._id}` });
  if (!checkout.url) throw new HttpError(502, "Stripe did not return a checkout URL");

  const now = new Date();
  await db.collection("bookings").updateOne(
    { _id: booking._id, paymentStatus: "pending", bookingStatus: "pending", stripeSessionId: { $exists: false } },
    { $set: { stripeSessionId: checkout.id, updatedAt: now } }
  );
  const refreshed = await db.collection("bookings").findOne({ _id: booking._id });
  if (refreshed.stripeSessionId !== checkout.id) throw new HttpError(409, "A checkout session was created concurrently; retry using the existing session");
  await db.collection("payments").updateOne(
    { stripeSessionId: checkout.id },
    {
      $set: {
        bookingId: booking._id,
        customerId: booking.customerId,
        stripeSessionId: checkout.id,
        stripePaymentIntentId: null,
        amount: booking.totalAmount,
        currency: env.STRIPE_CURRENCY.toLowerCase(),
        status: "pending",
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );
  success(res, "Checkout session created", { checkoutUrl: checkout.url, sessionId: checkout.id }, 201);
}

export async function verifyCheckoutSession(req, res) {
  const sessionId = typeof req.query.session_id === "string" ? req.query.session_id : "";
  if (!sessionId || !sessionId.startsWith("cs_")) throw new HttpError(400, "Invalid checkout session id");
  const db = getDatabase();
  const booking = await db.collection("bookings").findOne({ stripeSessionId: sessionId, customerId: req.user.mongoId });
  if (!booking) throw new HttpError(404, "Payment session not found");
  const checkout = await getStripe().checkout.sessions.retrieve(sessionId);
  if (checkout.metadata?.customerId !== String(req.user.mongoId)) throw new HttpError(403, "Payment session does not belong to this customer");
  const result = await applySessionResult(checkout, checkout.payment_status === "paid" ? "paid" : checkout.status === "expired" ? "failed" : "pending");
  success(res, "Checkout status verified with Stripe", result);
}

export async function handleStripeWebhook(req, res) {
  if (!env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET === "whsec_your_secret") {
    throw new HttpError(503, "Stripe webhook credentials are not configured");
  }
  const signature = req.headers["stripe-signature"];
  if (!signature || !Buffer.isBuffer(req.body)) throw new HttpError(400, "Invalid Stripe webhook request");

  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new HttpError(400, "Invalid Stripe webhook signature");
  }
  const db = getDatabase();
  if (await db.collection("stripeWebhookEvents").findOne({ eventId: event.id })) {
    return success(res, "Webhook event already processed", { received: true });
  }

  const object = event.data.object;
  const supported = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired"];
  if (!supported.includes(event.type)) {
    await db.collection("stripeWebhookEvents").insertOne({ eventId: event.id, type: event.type, processedAt: new Date() });
    return success(res, "Webhook event ignored", { received: true });
  }

  const checkout = await getStripe().checkout.sessions.retrieve(object.id);
  let status = "pending";
  if (checkout.payment_status === "paid") status = "paid";
  else if (checkout.status === "expired" || event.type === "checkout.session.async_payment_failed") status = "failed";
  const result = await applySessionResult(checkout, status);
  try {
    await db.collection("stripeWebhookEvents").insertOne({ eventId: event.id, type: event.type, processedAt: new Date() });
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
  success(res, "Webhook event processed", { received: true, ...result });
}
