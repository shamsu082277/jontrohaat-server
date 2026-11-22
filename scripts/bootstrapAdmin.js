import crypto from "node:crypto";
import { promisify } from "node:util";
import { MongoClient, ObjectId } from "mongodb";
import { env } from "../src/config/env.js";

const scryptAsync = promisify(crypto.scrypt);

const SCRYPT_CONFIG = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
  maxmem: 128 * 16384 * 16 * 2,
};

/**
 * Better-Auth compatible password hashing using Node's standard crypto.scrypt
 */
export async function hashPasswordBetterAuth(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(
    password.normalize("NFKC"),
    salt,
    SCRYPT_CONFIG.dkLen,
    {
      N: SCRYPT_CONFIG.N,
      r: SCRYPT_CONFIG.r,
      p: SCRYPT_CONFIG.p,
      maxmem: SCRYPT_CONFIG.maxmem,
    }
  );
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Bootstrap Initial Admin Account
 * Idempotent, secure, respects single-admin policy.
 */
export async function bootstrapAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@testemail.com").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123test";

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be configured");
  }

  const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db(env.DB_NAME);
    const userCollection = db.collection(env.AUTH_USER_COLLECTION || "user");
    const accountCollection = db.collection("account");

    // 1. Check if ANY admin already exists
    const existingAdmin = await userCollection.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log(`[Admin Bootstrap] Admin account already exists (Email: ${existingAdmin.email}). Skipping creation.`);
      return { success: true, message: "Admin account already exists", email: existingAdmin.email };
    }

    // 2. Check if user with adminEmail exists
    let user = await userCollection.findOne({ email: adminEmail });
    const now = new Date();

    if (!user) {
      const userId = new ObjectId().toString();
      const newUser = {
        _id: userId,
        name: "JontroHaat Administrator",
        email: adminEmail,
        emailVerified: true,
        image: null,
        role: "admin",
        createdAt: now,
        updatedAt: now,
      };
      await userCollection.insertOne(newUser);
      user = newUser;
      console.log(`[Admin Bootstrap] Created user record for ${adminEmail}`);
    } else {
      await userCollection.updateOne(
        { _id: user._id },
        { $set: { role: "admin", updatedAt: now } }
      );
      console.log(`[Admin Bootstrap] Elevated existing user ${adminEmail} to admin`);
    }

    // 3. Ensure Better Auth password credential account exists
    const existingCredentialAccount = await accountCollection.findOne({
      userId: String(user._id),
      providerId: "credential",
    });

    if (!existingCredentialAccount) {
      const hashedPassword = await hashPasswordBetterAuth(adminPassword);
      const accountId = new ObjectId().toString();
      await accountCollection.insertOne({
        _id: accountId,
        accountId: String(user._id),
        providerId: "credential",
        userId: String(user._id),
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`[Admin Bootstrap] Created credential account for ${adminEmail}`);
    }

    console.log(`[Admin Bootstrap] Successfully verified initial admin account: ${adminEmail}`);
    return { success: true, message: "Admin bootstrap complete", email: adminEmail };
  } finally {
    await client.close();
  }
}

// Allow direct CLI execution
if (process.argv[1]?.endsWith("bootstrapAdmin.js")) {
  bootstrapAdmin()
    .then((res) => {
      console.log(res);
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Admin Bootstrap Error]:", err.message);
      process.exit(1);
    });
}
