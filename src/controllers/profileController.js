import { env } from "../config/env.js";
import { getDatabase } from "../config/db.js";
import { HttpError, success } from "../utils/http.js";

export async function getProfile(req, res) {
  const db = getDatabase();
  const user = await db.collection(env.AUTH_USER_COLLECTION).findOne({ _id: req.user.mongoId });
  if (!user) throw new HttpError(404, "User not found");
  const { role, name, email, phone, address, district, division, image, createdAt, updatedAt, _id } = user;
  success(res, "Profile retrieved", { id: String(_id), name, email, role: role || "customer", phone, address, district, division, image, createdAt, updatedAt });
}

export async function updateProfile(req, res) {
  const db = getDatabase();
  await db.collection(env.AUTH_USER_COLLECTION).updateOne(
    { _id: req.user.mongoId },
    { $set: { ...req.body, updatedAt: new Date() } }
  );
  return getProfile(req, res);
}
