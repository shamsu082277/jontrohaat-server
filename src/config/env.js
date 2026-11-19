import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/jontrohaat"),
  DB_NAME: z.string().min(1).default("jontrohaat"),
  AUTH_USER_COLLECTION: z.string().min(1).default("user"),
  BETTER_AUTH_JWKS_URL: z.string().url().default("http://localhost:3000/api/auth/jwks"),
  JWT_ISSUER: z.string().min(1).default("http://localhost:3000"),
  JWT_AUDIENCE: z.string().min(1).default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
}

export const env = parsed.data;
