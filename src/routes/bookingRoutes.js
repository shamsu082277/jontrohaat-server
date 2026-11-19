import { Router } from "express";
import { verifyToken, verifyRenter, verifyOwner } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { bookingCreateSchema } from "../validators/schemas.js";
import { createBooking, getMyRentals, getOwnerRentals, getBooking } from "../controllers/bookingController.js";

const router = Router();
router.post("/", verifyToken, verifyRenter, validate(bookingCreateSchema), (req, res, next) => createBooking(req, res).catch(next));
router.get("/my-rentals", verifyToken, verifyRenter, (req, res, next) => getMyRentals(req, res).catch(next));
router.get("/owner-rentals", verifyToken, verifyOwner, (req, res, next) => getOwnerRentals(req, res).catch(next));
router.get("/:id", verifyToken, (req, res, next) => getBooking(req, res).catch(next));
export default router;
