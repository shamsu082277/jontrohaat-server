import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLIENT_URL: z.string().refine((value) => value.split(",").every((item) => {
    try {
      const url = new URL(item.trim());
      return ["http:", "https:"].includes(url.protocol) && url.origin === item.trim();
    } catch {
      return false;
    }
  }), "CLIENT_URL must contain comma-separated origins").default("http://localhost:3000"),
  MONGODB_URI: z.string().min(1).refine(
    (value) => /^mongodb(?:\+srv)?:\/\//i.test(value) || value === "your_mongodb_connection_string",
    "MONGODB_URI must be a MongoDB connection string"
  ).default("mongodb://127.0.0.1:27017/jontrohaat"),
  DB_NAME: z.string().min(1).default("jontrohaat"),
  AUTH_USER_COLLECTION: z.string().min(1).default("user"),
  BETTER_AUTH_JWKS_URL: z.string().url().default("http://localhost:3000/api/auth/jwks"),
  JWT_ISSUER: z.string().url().default("http://localhost:3000"),
  JWT_AUDIENCE: z.string().url().default("http://localhost:3000"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CURRENCY: z.string().regex(/^bdt$/i).default("bdt"),
  IMGBB_API_KEY: z.string().optional(),
  RESERVATION_MINUTES: z.coerce.number().int().positive().max(1410).default(60),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
}

if (parsed.data.NODE_ENV === "production") {
  const localSettings = [
    parsed.data.CLIENT_URL,
    parsed.data.BETTER_AUTH_JWKS_URL,
    parsed.data.JWT_ISSUER,
    parsed.data.JWT_AUDIENCE,
    parsed.data.MONGODB_URI,
  ];
  if (localSettings.some((value) => /localhost|127\.0\.0\.1|your_mongodb_connection_string/i.test(value))) {
    throw new Error("Production requires configured public URLs and a production MongoDB connection string");
  }
}

export const env = parsed.data;
