import { env } from "../config/env.js";
import { getDatabase } from "../config/db.js";
import { HttpError, success } from "../utils/http.js";
import { authUserFilter, toObjectId } from "../utils/objectId.js";
import { serializeEquipment } from "../utils/serialize.js";

async function serializeAdminEquipment(db, item) {
  const owner = await db.collection(env.AUTH_USER_COLLECTION).findOne(
    { _id: item.ownerId },
    { projection: { name: 1, email: 1, phone: 1, district: 1, division: 1, image: 1, createdAt: 1 } }
  );
  return serializeEquipment(item, owner || {});
}

export async function getUsers(req, res) {
  const records = await getDatabase().collection(env.AUTH_USER_COLLECTION).find({}, {
    projection: { name: 1, email: 1, role: 1, image: 1, phone: 1, district: 1, division: 1, createdAt: 1, updatedAt: 1 },
  }).toArray();
  const users = records.map((user) => ({ ...user, id: String(user._id), role: user.role || "customer" }));
  success(res, "Users retrieved", users);
}

export async function changeUserRole(req, res) {
  const filter = authUserFilter(req.params.id);
  const db = getDatabase();
  const targetUser = await db.collection(env.AUTH_USER_COLLECTION).findOne(filter);
  if (!targetUser) throw new HttpError(404, "User not found");

  // Single-admin policy enforcement
  if (req.body.role === "admin") {
    const existingAdmin = await db.collection(env.AUTH_USER_COLLECTION).findOne({ role: "admin" });
    if (existingAdmin && String(existingAdmin._id) !== String(targetUser._id)) {
      throw new HttpError(400, "Only one administrator is allowed. An existing administrator account is already active.");
    }
  }

  // Prevent admin from accidentally demoting themselves if they are the only admin
  if (targetUser.role === "admin" && req.body.role !== "admin") {
    const adminCount = await db.collection(env.AUTH_USER_COLLECTION).countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      throw new HttpError(400, "Cannot change role of the sole platform administrator.");
    }
  }

  const result = await db.collection(env.AUTH_USER_COLLECTION).updateOne(filter, { $set: { role: req.body.role, updatedAt: new Date() } });
  if (!result.matchedCount) throw new HttpError(404, "User not found");
  const user = await db.collection(env.AUTH_USER_COLLECTION).findOne(filter, {
    projection: { name: 1, email: 1, role: 1, image: 1, phone: 1, district: 1, division: 1, createdAt: 1, updatedAt: 1 },
  });
  if (user) user.id = String(user._id);
  success(res, "User role updated", user);
}

export async function updateUserAccount(req, res) {
  const filter = authUserFilter(req.params.id);
  const db = getDatabase();
  const result = await db.collection(env.AUTH_USER_COLLECTION).updateOne(filter, { $set: { ...req.body, updatedAt: new Date() } });
  if (!result.matchedCount) throw new HttpError(404, "User not found");
  const user = await db.collection(env.AUTH_USER_COLLECTION).findOne(filter, {
    projection: { name: 1, email: 1, role: 1, image: 1, phone: 1, district: 1, division: 1, createdAt: 1, updatedAt: 1 },
  });
  if (user) user.id = String(user._id);
  success(res, "User account updated", user);
}

export async function deleteUser(req, res) {
  const id = req.params.id;
  if (String(id) === req.user.id || String(id) === String(req.user.mongoId)) throw new HttpError(400, "An admin cannot delete their own account through this endpoint");
  const result = await getDatabase().collection(env.AUTH_USER_COLLECTION).deleteOne(authUserFilter(id));
  if (!result.deletedCount) throw new HttpError(404, "User not found");
  success(res, "User account deleted", { deleted: true });
}

export async function getAllEquipment(req, res) {
  const db = getDatabase();
  const records = await db.collection("equipment").find({}).sort({ createdAt: -1 }).toArray();
  const items = await Promise.all(records.map((item) => serializeAdminEquipment(db, item)));
  success(res, "All equipment retrieved", items);
}

export async function setEquipmentStatus(req, res) {
  const id = toObjectId(req.params.id, "equipment id");
  const db = getDatabase();
  const result = await db.collection("equipment").updateOne({ _id: id }, { $set: { status: req.body.status, updatedAt: new Date() } });
  if (!result.matchedCount) throw new HttpError(404, "Equipment not found");
  const item = await db.collection("equipment").findOne({ _id: id });
  success(res, "Equipment status updated", await serializeAdminEquipment(db, item));
}

export async function updateAllEquipment(req, res) {
  const id = toObjectId(req.params.id, "equipment id");
  const db = getDatabase();
  const result = await db.collection("equipment").updateOne({ _id: id }, { $set: { ...req.body, updatedAt: new Date() } });
  if (!result.matchedCount) throw new HttpError(404, "Equipment not found");
  const item = await db.collection("equipment").findOne({ _id: id });
  success(res, "Equipment updated", await serializeAdminEquipment(db, item));
}

export async function deleteAllEquipment(req, res) {
  const id = toObjectId(req.params.id, "equipment id");
  const result = await getDatabase().collection("equipment").deleteOne({ _id: id });
  if (!result.deletedCount) throw new HttpError(404, "Equipment not found");
  success(res, "Equipment deleted", { deleted: true });
}

