import { getDatabase } from "../config/db.js";
import { success } from "../utils/http.js";
import { env } from "../config/env.js";
import { serializeEquipment } from "../utils/serialize.js";

export async function getOwnerEquipment(req, res) {
  const db = getDatabase();
  const records = await db.collection("equipment").find({ ownerId: req.user.mongoId }).sort({ createdAt: -1 }).toArray();
  const items = await Promise.all(records.map(async (item) => {
    const owner = await db.collection(env.AUTH_USER_COLLECTION).findOne({ _id: item.ownerId }, { projection: { name: 1, email: 1, phone: 1, district: 1, division: 1, image: 1, createdAt: 1 } });
    return serializeEquipment(item, owner || {});
  }));
  success(res, "Owner equipment retrieved", items);
}
