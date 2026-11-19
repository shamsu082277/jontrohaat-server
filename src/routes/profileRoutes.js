import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { profileSchema } from "../validators/schemas.js";
import { getProfile, updateProfile } from "../controllers/profileController.js";

const router = Router();
router.use(verifyToken);
router.get("/me", (req, res, next) => getProfile(req, res).catch(next));
router.patch("/me", validate(profileSchema), (req, res, next) => updateProfile(req, res).catch(next));
export default router;
