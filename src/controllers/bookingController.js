import { getDatabase } from "../config/db.js";
import { HttpError, success } from "../utils/http.js";
import { toObjectId } from "../utils/objectId.js";

export async function createBooking(req, res) {
  const db = getDatabase();
  const equipmentId = toObjectId(req.body.equipmentId, "equipment id");
  const equipment = await db.collection("equipment").findOne({ _id: equipmentId, status: "approved" });
  if (!equipment) throw new HttpError(404, "Approved equipment not found");
  if (equipment.availableQuantity < req.body.quantity) throw new HttpError(409, "Requested quantity is not available");

  const startDate = new Date(req.body.startDate);
  const endDate = new Date(req.body.endDate);
  if (endDate <= startDate) throw new HttpError(400, "End date must be after start date");

  const booking = {
    ...req.body,
    equipmentId,
    customerId: req.user.mongoId,
    ownerId: equipment.ownerId,
    status: "pending",
    totalAmount: equipment.rentalPrice * req.body.quantity,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await db.collection("bookings").insertOne(booking);
  success(res, "Booking created", { ...booking, _id: result.insertedId }, 201);
}

export async function getMyRentals(req, res) {
  const items = await getDatabase().collection("bookings").find({ customerId: req.user.mongoId }).sort({ createdAt: -1 }).toArray();
  success(res, "My rentals retrieved", items);
}

export async function getOwnerRentals(req, res) {
  const items = await getDatabase().collection("bookings").find({ ownerId: req.user.mongoId }).sort({ createdAt: -1 }).toArray();
  success(res, "Owner rentals retrieved", items);
}

export async function getBooking(req, res) {
  const id = toObjectId(req.params.id, "booking id");
  const item = await getDatabase().collection("bookings").findOne({ _id: id });
  if (!item) throw new HttpError(404, "Booking not found");
  const ownsBooking = item.customerId?.equals?.(req.user.mongoId) || item.ownerId?.equals?.(req.user.mongoId);
  if (req.user.role !== "admin" && !ownsBooking) throw new HttpError(403, "You do not have permission to view this booking");
  success(res, "Booking retrieved", item);
}
