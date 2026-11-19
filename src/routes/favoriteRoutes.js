import { Router } from "express";
import { verifyToken, verifyRenter } from "../middleware/auth.js";
import { listFavorites, addFavorite, removeFavorite } from "../controllers/favoriteController.js";

const router = Router();
router.use(verifyToken, verifyRenter);
router.get("/", (req, res, next) => listFavorites(req, res).catch(next));
router.post("/:equipmentId", (req, res, next) => addFavorite(req, res).catch(next));
router.delete("/:equipmentId", (req, res, next) => removeFavorite(req, res).catch(next));
export default router;
