import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { getDatabase } from "./config/db.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import { notFound, errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());

  const allowedOrigins = env.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean);
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use("/api", rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }));

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

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
