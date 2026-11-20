import { Router } from "express";
import { verifyToken, verifyRenter } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { bookingCreateSchema } from "../validators/schemas.js";
import { createBooking, getMyBookings, getBooking } from "../controllers/bookingController.js";

const router = Router();
router.post("/", verifyToken, verifyRenter, validate(bookingCreateSchema), (req, res, next) => createBooking(req, res).catch(next));
router.get("/my", verifyToken, verifyRenter, (req, res, next) => getMyBookings(req, res).catch(next));
router.get("/my-rentals", verifyToken, verifyRenter, (req, res, next) => getMyBookings(req, res).catch(next));
router.get("/:id", verifyToken, (req, res, next) => getBooking(req, res).catch(next));
export default router;
