import { Router } from "express";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { adminAnalytics } from "../controllers/analyticsController.js";
import { getAdminBookings, updateBookingStatus } from "../controllers/bookingController.js";
import { bookingStatusSchema } from "../validators/schemas.js";
import { roleSchema, statusSchema, confirmSchema, profileSchema, equipmentUpdateSchema } from "../validators/schemas.js";
import { getUsers, changeUserRole, updateUserAccount, deleteUser, getAllEquipment, setEquipmentStatus, updateAllEquipment, deleteAllEquipment } from "../controllers/adminController.js";

const router = Router();
router.use(verifyToken, verifyAdmin);

router.get("/users", (req, res, next) => getUsers(req, res).catch(next));
router.patch("/users/:id/role", validate(roleSchema), (req, res, next) => changeUserRole(req, res).catch(next));
router.patch("/users/:id", validate(profileSchema), (req, res, next) => updateUserAccount(req, res).catch(next));
router.delete("/users/:id", validate(confirmSchema), (req, res, next) => deleteUser(req, res).catch(next));

router.get("/equipment", (req, res, next) => getAllEquipment(req, res).catch(next));
router.patch("/equipment/:id/status", validate(statusSchema), (req, res, next) => setEquipmentStatus(req, res).catch(next));
router.patch("/equipment/:id", validate(equipmentUpdateSchema), (req, res, next) => updateAllEquipment(req, res).catch(next));
router.delete("/equipment/:id", validate(confirmSchema), (req, res, next) => deleteAllEquipment(req, res).catch(next));
router.get("/bookings", (req, res, next) => getAdminBookings(req, res).catch(next));
router.patch("/bookings/:id/status", validate(bookingStatusSchema), (req, res, next) => updateBookingStatus(req, res).catch(next));
router.get("/rentals", (req, res, next) => getAdminBookings(req, res).catch(next));
router.get("/analytics", (req, res, next) => adminAnalytics(req, res).catch(next));

export default router;
