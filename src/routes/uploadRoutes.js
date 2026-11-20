import { Router } from "express";
import multer from "multer";
import { verifyToken } from "../middleware/auth.js";
import { uploadImage } from "../controllers/uploadController.js";
import { HttpError } from "../utils/http.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) {
      return callback(new HttpError(400, "Only PNG, JPEG, and WEBP images are supported"));
    }
    callback(null, true);
  },
});

const router = Router();
router.post("/image", verifyToken, (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return next(new HttpError(413, "Image must be 5MB or smaller"));
      }
      return next(error);
    }
    uploadImage(req, res).catch(next);
  });
});
export default router;
