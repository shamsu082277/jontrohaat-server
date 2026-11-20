import Stripe from "stripe";
import { env } from "./env.js";
import { HttpError } from "../utils/http.js";

let stripe;

export function getStripe() {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_SECRET_KEY.startsWith("sk_test_") || env.STRIPE_SECRET_KEY === "sk_test_your_key") {
    throw new HttpError(503, "Stripe test credentials are not configured");
  }
  if (!stripe) stripe = new Stripe(env.STRIPE_SECRET_KEY);
  return stripe;
}
