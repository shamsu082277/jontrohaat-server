import { env } from "../config/env.js";
import { getDatabase } from "../config/db.js";
import { HttpError, success } from "../utils/http.js";
import { authUserFilter } from "../utils/objectId.js";

export async function getUsers(req, res) {
  const users = await getDatabase().collection(env.AUTH_USER_COLLECTION).find({}, { projection: { hashedPassword: 0, password: 0 } }).toArray();
  success(res, "Users retrieved", users);
}

export async function changeUserRole(req, res) {
  const filter = authUserFilter(req.params.id);
  const db = getDatabase();
  const result = await db.collection(env.AUTH_USER_COLLECTION).updateOne(filter, { $set: { role: req.body.role, updatedAt: new Date() } });
  if (!result.matchedCount) throw new HttpError(404, "User not found");
  const user = await db.collection(env.AUTH_USER_COLLECTION).findOne(filter, { projection: { hashedPassword: 0, password: 0 } });
  success(res, "User role updated", user);
}

export async function updateUserAccount(req, res) {
  const filter = authUserFilter(req.params.id);
  const db = getDatabase();
  const result = await db.collection(env.AUTH_USER_COLLECTION).updateOne(filter, { $set: { ...req.body, updatedAt: new Date() } });
  if (!result.matchedCount) throw new HttpError(404, "User not found");
  success(res, "User account updated", await db.collection(env.AUTH_USER_COLLECTION).findOne(filter, { projection: { hashedPassword: 0, password: 0 } }));
}

export async function deleteUser(req, res) {
  const id = req.params.id;
  if (String(id) === req.user.id || String(id) === String(req.user.mongoId)) throw new HttpError(400, "An admin cannot delete their own account through this endpoint");
  const result = await getDatabase().collection(env.AUTH_USER_COLLECTION).deleteOne(authUserFilter(id));
  if (!result.deletedCount) throw new HttpError(404, "User not found");
  success(res, "User account deleted", { deleted: true });
}

export async function getAllEquipment(req, res) {
  const items = await getDatabase().collection("equipment").find({}).sort({ createdAt: -1 }).toArray();
  success(res, "All equipment retrieved", items);
}

export async function setEquipmentStatus(req, res) {
  const id = toObjectId(req.params.id, "equipment id");
  const db = getDatabase();
  const result = await db.collection("equipment").updateOne({ _id: id }, { $set: { status: req.body.status, updatedAt: new Date() } });
  if (!result.matchedCount) throw new HttpError(404, "Equipment not found");
  success(res, "Equipment status updated", await db.collection("equipment").findOne({ _id: id }));
}

export async function updateAllEquipment(req, res) {
  const id = toObjectId(req.params.id, "equipment id");
  const db = getDatabase();
  const result = await db.collection("equipment").updateOne({ _id: id }, { $set: { ...req.body, updatedAt: new Date() } });
  if (!result.matchedCount) throw new HttpError(404, "Equipment not found");
  success(res, "Equipment updated", await db.collection("equipment").findOne({ _id: id }));
}

export async function deleteAllEquipment(req, res) {
  const id = toObjectId(req.params.id, "equipment id");
  const result = await getDatabase().collection("equipment").deleteOne({ _id: id });
  if (!result.deletedCount) throw new HttpError(404, "Equipment not found");
  success(res, "Equipment deleted", { deleted: true });
}

export async function getAllBookings(req, res) {
  const items = await getDatabase().collection("bookings").find({}).sort({ createdAt: -1 }).toArray();
  success(res, "Bookings retrieved", items);
}
