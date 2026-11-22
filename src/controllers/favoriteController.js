import { env } from "../config/env.js";
import { getDatabase } from "../config/db.js";
import { HttpError, success } from "../utils/http.js";
import { toObjectId } from "../utils/objectId.js";
import { serializeEquipment } from "../utils/serialize.js";

export async function listFavorites(req, res) {
  const db = getDatabase();
  const favorites = await db.collection("favorites").find({ userId: req.user.mongoId }).sort({ createdAt: -1 }).toArray();
  const equipmentIds = favorites.map((item) => item.equipmentId);
  const records = equipmentIds.length
    ? await db.collection("equipment").find({ _id: { $in: equipmentIds }, status: "approved" }).toArray()
    : [];
  const recordsById = new Map(records.map((item) => [String(item._id), item]));
  const items = await Promise.all(favorites.flatMap((favorite) => {
    const equipment = recordsById.get(String(favorite.equipmentId));
    if (!equipment) return [];
    return [db.collection(env.AUTH_USER_COLLECTION).findOne(
      { _id: equipment.ownerId },
      { projection: { name: 1, image: 1, district: 1, division: 1, createdAt: 1 } }
    ).then((owner) => serializeEquipment(equipment, owner || {}))];
  }));
  success(res, "Favorites retrieved", items);
}

export async function addFavorite(req, res) {
  const equipmentId = toObjectId(req.params.equipmentId, "equipment id");
  const db = getDatabase();
  if (!await db.collection("equipment").findOne({ _id: equipmentId, status: "approved" })) throw new HttpError(404, "Equipment not found");
  try {
    await db.collection("favorites").insertOne({ userId: req.user.mongoId, equipmentId, createdAt: new Date() });
  } catch (error) {
    if (error?.code === 11000) throw new HttpError(409, "Equipment is already in favorites");
    throw error;
  }
  success(res, "Added to favorites", { equipmentId: String(equipmentId) }, 201);
}

export async function removeFavorite(req, res) {
  const equipmentId = toObjectId(req.params.equipmentId, "equipment id");
  const result = await getDatabase().collection("favorites").deleteOne({ userId: req.user.mongoId, equipmentId });
  if (!result.deletedCount) throw new HttpError(404, "Favorite not found");
  success(res, "Removed from favorites", { deleted: true });
}
