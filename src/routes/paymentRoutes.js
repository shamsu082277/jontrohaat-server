import { Router } from "express";
import { verifyToken, verifyRenter } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { checkoutSchema } from "../validators/schemas.js";
import { createCheckoutSession, verifyCheckoutSession } from "../controllers/paymentController.js";

const router = Router();
router.post("/checkout-session", verifyToken, verifyRenter, validate(checkoutSchema), (req, res, next) => createCheckoutSession(req, res).catch(next));
router.post("/create-checkout-session", verifyToken, verifyRenter, validate(checkoutSchema), (req, res, next) => createCheckoutSession(req, res).catch(next));
router.get("/verify-session", verifyToken, verifyRenter, (req, res, next) => verifyCheckoutSession(req, res).catch(next));
export default router;
