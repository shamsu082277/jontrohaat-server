import { getDatabase, getMongoClient } from "../config/db.js";
import { env } from "../config/env.js";
import { HttpError, success } from "../utils/http.js";
import { toObjectId } from "../utils/objectId.js";

const activeStatuses = ["confirmed", "active"];

function rentalDuration(startDate, endDate, rentalType) {
  const unit = rentalType === "per_hour" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / unit));
}

function isSameUser(left, right) {
  return String(left) === String(right);
}

async function serializeBookings(items) {
  const db = getDatabase();
  return Promise.all(items.map(async (booking) => {
    const [equipment, customer] = await Promise.all([
      db.collection("equipment").findOne({ _id: booking.equipmentId }),
      db.collection(env.AUTH_USER_COLLECTION).findOne({ _id: booking.customerId }, { projection: { name: 1, email: 1 } }),
    ]);
    return {
      ...booking,
      _id: String(booking._id),
      equipmentId: String(booking.equipmentId),
      customerId: String(booking.customerId),
      ownerId: String(booking.ownerId),
      renterId: String(booking.customerId),
      renterName: customer?.name || "Customer",
      renterEmail: customer?.email || "",
      renterPhone: booking.contactNumber,
      equipmentTitle: equipment?.title || "Equipment",
      equipmentImage: equipment?.image || equipment?.images?.[0],
      durationDays: booking.rentalDuration,
      dailyRate: equipment?.rentalPrice || 0,
      totalPrice: booking.totalAmount,
    };
  }));
}

export async function releaseExpiredReservations() {
  const db = getDatabase();
  const expired = await db.collection("bookings").find({
    bookingStatus: "pending",
    paymentStatus: "pending",
    expiresAt: { $lte: new Date() },
    reservationReleased: { $ne: true },
  }).toArray();

  for (const booking of expired) {
    await db.collection("bookings").updateOne(
      { _id: booking._id, bookingStatus: "pending", paymentStatus: "pending", expiresAt: { $lte: new Date() }, reservationReleased: { $ne: true } },
      { $set: { bookingStatus: "cancelled", paymentStatus: "failed", reservationReleased: true, updatedAt: new Date() } }
    );
  }
}

export async function createBooking(req, res) {
  await releaseExpiredReservations();
  const db = getDatabase();
  const client = getMongoClient();
  if (!client) throw new HttpError(503, "Database transaction support is unavailable");

  const equipmentId = toObjectId(req.body.equipmentId, "equipment id");
  const startDate = new Date(req.body.startDate);
  const endDate = new Date(req.body.endDate);
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || startDate <= new Date() || endDate <= startDate) {
    throw new HttpError(400, "Start date must be in the future and end date must be after start date");
  }

  const session = client.startSession();
  let created;
  try {
    await session.withTransaction(async () => {
      const equipment = await db.collection("equipment").findOne({ _id: equipmentId, status: "approved" }, { session });
      if (!equipment) throw new HttpError(404, "Approved equipment not found");
      if (isSameUser(equipment.ownerId, req.user.mongoId)) throw new HttpError(400, "You cannot book your own equipment");
      if (!Number.isInteger(equipment.availableQuantity) || equipment.availableQuantity < req.body.quantity) {
        throw new HttpError(409, "Requested quantity is not available");
      }

      const lock = await db.collection("equipment").updateOne(
        { _id: equipmentId, status: "approved", availableQuantity: { $gte: req.body.quantity } },
        { $inc: { reservationVersion: 1 } },
        { session }
      );
      if (!lock.matchedCount) throw new HttpError(409, "Requested quantity is not available");

      const overlaps = await db.collection("bookings").aggregate([
        {
          $match: {
            equipmentId,
            startDate: { $lt: endDate },
            endDate: { $gt: startDate },
            $or: [
              { bookingStatus: { $in: activeStatuses } },
              { bookingStatus: "pending", paymentStatus: "pending", expiresAt: { $gt: new Date() } },
            ],
          },
        },
        { $group: { _id: null, quantity: { $sum: "$quantity" } } },
      ], { session }).toArray();
      const reservedQuantity = overlaps[0]?.quantity || 0;
      if (reservedQuantity + req.body.quantity > equipment.availableQuantity) {
        throw new HttpError(409, "Equipment is already reserved for part or all of these dates");
      }

      if (equipment.rentalType === "per_acre" && (!Number.isFinite(req.body.areaAcres) || req.body.areaAcres <= 0)) {
        throw new HttpError(400, "Area in acres is required for per-acre equipment");
      }
      const duration = rentalDuration(startDate, endDate, equipment.rentalType);
      const multiplier = equipment.rentalType === "per_acre" ? req.body.areaAcres : duration;
      const totalAmount = Math.round(equipment.rentalPrice * multiplier * req.body.quantity * 100) / 100;
      const now = new Date();
      const booking = {
        customerId: req.user.mongoId,
        ownerId: equipment.ownerId,
        equipmentId,
        startDate,
        endDate,
        quantity: req.body.quantity,
        contactNumber: req.body.contactNumber,
        deliveryAddress: req.body.deliveryAddress,
        ...(req.body.notes ? { notes: req.body.notes } : {}),
        ...(req.body.areaAcres ? { areaAcres: req.body.areaAcres } : {}),
        rentalDuration: duration,
        totalAmount,
        paymentStatus: "pending",
        bookingStatus: "pending",
        expiresAt: new Date(now.getTime() + env.RESERVATION_MINUTES * 60 * 1000),
        reservationReleased: false,
        createdAt: now,
        updatedAt: now,
      };
      const result = await db.collection("bookings").insertOne(booking, { session });
      created = { ...booking, _id: result.insertedId };
    }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error?.code === 20 || /transaction numbers are only allowed|replica set/i.test(error?.message || "")) {
      throw new HttpError(503, "Booking requires MongoDB Atlas or a replica-set deployment with transaction support");
    }
    throw error;
  } finally {
    await session.endSession();
  }
  const [serialized] = await serializeBookings([created]);
  success(res, "Booking created; complete payment before the reservation expires", serialized, 201);
}

export async function getMyBookings(req, res) {
  const items = await serializeBookings(await getDatabase().collection("bookings").find({ customerId: req.user.mongoId }).sort({ createdAt: -1 }).toArray());
  success(res, "My bookings retrieved", items);
}

export async function getOwnerBookings(req, res) {
  const items = await serializeBookings(await getDatabase().collection("bookings").find({ ownerId: req.user.mongoId }).sort({ createdAt: -1 }).toArray());
  success(res, "Owner bookings retrieved", items);
}

export async function getAdminBookings(req, res) {
  const items = await serializeBookings(await getDatabase().collection("bookings").find({}).sort({ createdAt: -1 }).toArray());
  success(res, "All bookings retrieved", items);
}

export async function getBooking(req, res) {
  const id = toObjectId(req.params.id, "booking id");
  const item = await getDatabase().collection("bookings").findOne({ _id: id });
  if (!item) throw new HttpError(404, "Booking not found");
  const ownsBooking = isSameUser(item.customerId, req.user.mongoId) || isSameUser(item.ownerId, req.user.mongoId);
  if (req.user.role !== "admin" && !ownsBooking) throw new HttpError(403, "You do not have permission to view this booking");
  const [serialized] = await serializeBookings([item]);
  success(res, "Booking retrieved", serialized);
}

export async function updateBookingStatus(req, res) {
  const id = toObjectId(req.params.id, "booking id");
  const db = getDatabase();
  const filter = { _id: id };
  if (req.user.role === "owner") filter.ownerId = req.user.mongoId;
  const booking = await db.collection("bookings").findOne(filter);
  if (!booking) throw new HttpError(404, "Booking not found");
  const allowedTransitions = {
    pending: ["cancelled"],
    confirmed: ["active", "cancelled"],
    active: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  const nextStatus = req.body.bookingStatus;
  if (!allowedTransitions[booking.bookingStatus]?.includes(nextStatus)) {
    throw new HttpError(409, "Invalid booking status transition");
  }
  if (["confirmed", "active", "completed"].includes(nextStatus) && booking.paymentStatus !== "paid") {
    throw new HttpError(409, "Booking must be paid before it can be confirmed or fulfilled");
  }
  const updated = await db.collection("bookings").updateOne(
    { _id: id, bookingStatus: booking.bookingStatus },
    { $set: { bookingStatus: nextStatus, reservationReleased: nextStatus === "cancelled", updatedAt: new Date() } }
  );
  if (!updated.matchedCount) throw new HttpError(409, "Booking was updated by another request");
  const [serialized] = await serializeBookings([await db.collection("bookings").findOne({ _id: id })]);
  success(res, "Booking status updated", serialized);
}
