import { getDatabase } from "../config/db.js";
import { HttpError, success } from "../utils/http.js";
import { toObjectId } from "../utils/objectId.js";
import { env } from "../config/env.js";
import { serializeEquipment } from "../utils/serialize.js";

async function serializeMany(items) {
  const db = getDatabase();
  return Promise.all(items.map(async (item) => {
    const owner = await db.collection(env.AUTH_USER_COLLECTION).findOne(
      { _id: item.ownerId },
      { projection: { name: 1, email: 1, phone: 1, district: 1, division: 1, image: 1, createdAt: 1 } }
    );
    return serializeEquipment(item, owner || {});
  }));
}

function safeString(value, max = 100) {
  return typeof value === "string" && value.length <= max ? value.trim() : undefined;
}

export async function listEquipment(req, res) {
  const db = getDatabase();
  const query = { status: "approved" };
  const search = safeString(req.query.search, 100);
  const category = safeString(req.query.category, 80);
  const location = safeString(req.query.location, 200);
  const district = safeString(req.query.district, 80);
  const division = safeString(req.query.division, 80);
  const rentalType = safeString(req.query.rentalType, 20);
  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (location) query.$or = [
    { "location.district": location },
    { "location.division": location },
    { location },
  ];
  if (district) query["location.district"] = district;
  if (division) query["location.division"] = division;
  if (rentalType && ["per_day", "per_hour", "per_acre"].includes(rentalType)) query.rentalType = rentalType;

  const minPrice = Number(req.query.minPrice);
  const maxPrice = Number(req.query.maxPrice);
  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    query.rentalPrice = {};
    if (Number.isFinite(minPrice) && minPrice >= 0) query.rentalPrice.$gte = minPrice;
    if (Number.isFinite(maxPrice) && maxPrice >= 0) query.rentalPrice.$lte = maxPrice;
  }
  if (req.query.available === "true") query.availableQuantity = { $gt: 0 };

  const page = Math.min(Math.max(Number.parseInt(req.query.page, 10) || 1, 1), 100000);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 12, 1), 100);
  const sortFields = { newest: { createdAt: -1 }, priceAsc: { rentalPrice: 1 }, priceDesc: { rentalPrice: -1 }, popular: { createdAt: -1 } };
  const sort = sortFields[safeString(req.query.sort, 20)] || sortFields.newest;

  const [rawItems, total] = await Promise.all([
    db.collection("equipment").find(query).sort(sort).skip((page - 1) * limit).limit(limit).toArray(),
    db.collection("equipment").countDocuments(query),
  ]);
  const items = await serializeMany(rawItems);
  success(res, "Equipment retrieved", { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function featuredEquipment(req, res) {
  const items = await serializeMany(await getDatabase().collection("equipment").find({ status: "approved", availableQuantity: { $gt: 0 } }).sort({ createdAt: -1 }).limit(10).toArray());
  success(res, "Featured equipment retrieved", items);
}

export async function getEquipment(req, res) {
  const id = toObjectId(req.params.id, "equipment id");
  const item = await getDatabase().collection("equipment").findOne({ _id: id });
  if (!item) throw new HttpError(404, "Equipment not found");
  if (item.status !== "approved") {
    const canView = req.user && (
      req.user.role === "admin" ||
      String(item.ownerId) === req.user.id ||
      item.ownerId?.equals?.(req.user.mongoId)
    );
    if (!canView) throw new HttpError(404, "Equipment not found");
  }
  const [serialized] = await serializeMany([item]);
  success(res, "Equipment retrieved", serialized);
}

export async function createEquipment(req, res) {
  const now = new Date();
  const item = {
    ...req.body,
    ownerId: req.user.mongoId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  const result = await getDatabase().collection("equipment").insertOne(item);
  const [serialized] = await serializeMany([{ ...item, _id: result.insertedId }]);
  success(res, "Equipment submitted for approval", serialized, 201);
}

export async function updateEquipment(req, res) {
  const id = toObjectId(req.params.id, "equipment id");
  const collection = getDatabase().collection("equipment");
  const item = await collection.findOne({ _id: id });
  if (!item) throw new HttpError(404, "Equipment not found");
  if (req.user.role !== "admin" && (String(item.ownerId) !== req.user.id && !item.ownerId?.equals?.(req.user.mongoId))) {
    throw new HttpError(403, "You can only manage your own equipment");
  }
  const now = new Date();
  await collection.updateOne({ _id: id }, { $set: { ...req.body, updatedAt: now } });
  const updated = await collection.findOne({ _id: id });
  const [serialized] = await serializeMany([updated]);
  success(res, "Equipment updated", serialized);
}

export async function deleteEquipment(req, res) {
  const id = toObjectId(req.params.id, "equipment id");
  const collection = getDatabase().collection("equipment");
  const item = await collection.findOne({ _id: id });
  if (!item) throw new HttpError(404, "Equipment not found");
  if (req.user.role !== "admin" && (String(item.ownerId) !== req.user.id && !item.ownerId?.equals?.(req.user.mongoId))) {
    throw new HttpError(403, "You can only manage your own equipment");
  }
  await collection.deleteOne({ _id: id });
  success(res, "Equipment deleted", { deleted: true });
}
