import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { connectDatabase, getDatabase } from "./config/db.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import { handleStripeWebhook } from "./controllers/paymentController.js";
import { notFound, errorHandler } from "./middleware/error.js";
import { HttpError } from "./utils/http.js";

export function createApp(options) {
  return configureApp(express(), options);
}

export function configureApp(app, { connectOnRequest = false } = {}) {
  app.disable("x-powered-by");
  if (process.env.VERCEL === "1" || process.env.VERCEL === "true") app.set("trust proxy", 1);
  app.use(helmet());

  const allowedOrigins = env.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean);
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new HttpError(403, "Origin is not allowed by CORS"));
    },
    credentials: true,
  }));
  app.use("/api", rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }));
  if (connectOnRequest) {
    app.use("/api", async (req, res, next) => {
      try {
        await connectDatabase();
        next();
      } catch {
        if (req.path === "/health") return next();
        next(new HttpError(503, "Database unavailable"));
      }
    });
  }
  app.post("/api/payments/webhook", express.raw({ type: "application/json", limit: "1mb" }), (req, res, next) => {
    handleStripeWebhook(req, res).catch(next);
  });
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));

  app.get("/", (req, res) => {
    res.status(200).json({
      success: true,
      message: "JontroHaat server is running",
      data: { status: "ok" },
    });
  });

  app.get("/api/health", async (req, res) => {
    let database = "disconnected";
    try {
      await getDatabase().command({ ping: 1 });
      database = "connected";
    } catch {
      database = "disconnected";
    }
    res.status(database === "connected" ? 200 : 503).json({
      success: database === "connected",
      message: database === "connected" ? "Server healthy" : "Server running; database unavailable",
      data: { status: "ok", database },
    });
  });

  app.use("/api/equipment", equipmentRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/users", profileRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/owner", ownerRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/uploads", uploadRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
