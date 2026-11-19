import { Router } from "express";
import { verifyToken, verifyOwner } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { equipmentCreateSchema, equipmentUpdateSchema } from "../validators/schemas.js";
import { listEquipment, featuredEquipment, getEquipment, createEquipment, updateEquipment, deleteEquipment } from "../controllers/equipmentController.js";

const router = Router();

router.get("/", listEquipment);
router.get("/featured", featuredEquipment);
router.get("/:id", (req, res, next) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return verifyToken(req, res, () => getEquipment(req, res).catch(next));
  return getEquipment(req, res).catch(next);
});
router.post("/", verifyToken, verifyOwner, validate(equipmentCreateSchema), (req, res, next) => createEquipment(req, res).catch(next));
router.patch("/:id", verifyToken, validate(equipmentUpdateSchema), (req, res, next) => updateEquipment(req, res).catch(next));
router.delete("/:id", verifyToken, (req, res, next) => deleteEquipment(req, res).catch(next));

export default router;
