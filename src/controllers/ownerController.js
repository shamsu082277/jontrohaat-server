import { getDatabase } from "../config/db.js";
import { success } from "../utils/http.js";

export async function getOwnerEquipment(req, res) {
  const items = await getDatabase().collection("equipment").find({ ownerId: req.user.mongoId }).sort({ createdAt: -1 }).toArray();
  success(res, "Owner equipment retrieved", items);
}
