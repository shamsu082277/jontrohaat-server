import { MongoClient } from "mongodb";
import { env } from "./env.js";

let client;
let db;

export async function connectDatabase() {
  if (db) return db;
  const uri = env.MONGODB_URI;
  if (!uri || uri === "your_mongodb_connection_string") {
    throw new Error("MONGODB_URI is not configured");
  }
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  db = client.db(env.DB_NAME);
  await createIndexes(db);
  return db;
}

export function getDatabase() {
  if (!db) throw new Error("Database is not connected");
  return db;
}

export function getMongoClient() {
  return client;
}

export async function closeDatabase() {
  if (client) await client.close();
  client = undefined;
  db = undefined;
}

async function createIndexes(database) {
  await Promise.all([
    database.collection("equipment").createIndex({ status: 1, createdAt: -1 }),
    database.collection("equipment").createIndex({ category: 1, location: 1 }),
    database.collection("equipment").createIndex({ ownerId: 1 }),
    database.collection("equipment").createIndex({ title: "text", description: "text", brand: "text" }),
    database.collection("bookings").createIndex({ customerId: 1, createdAt: -1 }),
    database.collection("bookings").createIndex({ ownerId: 1, createdAt: -1 }),
    database.collection("bookings").createIndex({ equipmentId: 1 }),
    database.collection("bookings").createIndex({ equipmentId: 1, bookingStatus: 1, startDate: 1, endDate: 1 }),
    database.collection("bookings").createIndex({ paymentStatus: 1, expiresAt: 1 }),
    database.collection("favorites").createIndex({ userId: 1, equipmentId: 1 }, { unique: true }),
    database.collection("payments").createIndex({ bookingId: 1 }),
    database.collection("payments").createIndex({ stripeSessionId: 1 }, { unique: true, sparse: true }),
    database.collection("payments").createIndex({ customerId: 1, createdAt: -1 }),
    database.collection("stripeWebhookEvents").createIndex({ eventId: 1 }, { unique: true }),
  ]);
}
