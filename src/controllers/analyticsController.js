import { env } from "../config/env.js";
import { getDatabase } from "../config/db.js";
import { success } from "../utils/http.js";

export async function ownerAnalytics(req, res) {
  const db = getDatabase();
  const ownerId = req.user.mongoId;
  const equipment = db.collection("equipment");
  const bookings = db.collection("bookings");
  const payments = db.collection("payments");
  const [totalEquipment, approvedEquipment, pendingEquipment, totalRentals, completedRentals, earnings, monthlyEarnings] = await Promise.all([
    equipment.countDocuments({ ownerId }),
    equipment.countDocuments({ ownerId, status: "approved" }),
    equipment.countDocuments({ ownerId, status: "pending" }),
    bookings.countDocuments({ ownerId }),
    bookings.countDocuments({ ownerId, bookingStatus: "completed" }),
    payments.aggregate([
      { $match: { status: "paid" } },
      { $lookup: { from: "bookings", localField: "bookingId", foreignField: "_id", as: "booking" } },
      { $unwind: "$booking" },
      { $match: { "booking.ownerId": ownerId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).toArray(),
    payments.aggregate([
      { $match: { status: "paid" } },
      { $lookup: { from: "bookings", localField: "bookingId", foreignField: "_id", as: "booking" } },
      { $unwind: "$booking" },
      { $match: { "booking.ownerId": ownerId } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, earnings: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]).toArray(),
  ]);
  success(res, "Owner analytics retrieved", {
    totalEquipment,
    approvedEquipment,
    pendingEquipment,
    totalRentals,
    completedRentals,
    totalEarnings: earnings[0]?.total || 0,
    monthlyEarnings,
  });
}

export async function adminAnalytics(req, res) {
  const db = getDatabase();
  const [totalUsers, totalEquipment, totalBookings, pendingApprovals, completedRentals, revenue, monthlyBookings, categoryStatistics] = await Promise.all([
    db.collection(env.AUTH_USER_COLLECTION).countDocuments({}),
    db.collection("equipment").countDocuments({}),
    db.collection("bookings").countDocuments({}),
    db.collection("equipment").countDocuments({ status: "pending" }),
    db.collection("bookings").countDocuments({ bookingStatus: "completed" }),
    db.collection("payments").aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).toArray(),
    db.collection("bookings").aggregate([
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, bookings: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).toArray(),
    db.collection("equipment").aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray(),
  ]);
  success(res, "Admin analytics retrieved", {
    totalUsers,
    totalEquipment,
    totalBookings,
    pendingApprovals,
    completedRentals,
    totalRevenue: revenue[0]?.total || 0,
    monthlyBookings,
    categoryStatistics,
  });
}
