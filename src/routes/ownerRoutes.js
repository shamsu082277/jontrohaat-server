import { Router } from "express";
import { verifyToken, verifyOwner } from "../middleware/auth.js";
import { getOwnerBookings } from "../controllers/bookingController.js";
import { ownerAnalytics } from "../controllers/analyticsController.js";
import { getOwnerEquipment } from "../controllers/ownerController.js";

const router = Router();
router.use(verifyToken, verifyOwner);
router.get("/bookings", (req, res, next) => getOwnerBookings(req, res).catch(next));
router.get("/rentals", (req, res, next) => getOwnerBookings(req, res).catch(next));
router.get("/analytics", (req, res, next) => ownerAnalytics(req, res).catch(next));
router.get("/equipment", (req, res, next) => getOwnerEquipment(req, res).catch(next));
export default router;
