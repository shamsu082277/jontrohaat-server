import { createRemoteJWKSet, jwtVerify } from "jose";
import { ObjectId } from "mongodb";
import { env } from "../config/env.js";
import { getDatabase } from "../config/db.js";
import { HttpError } from "../utils/http.js";

const jwks = createRemoteJWKSet(new URL(env.BETTER_AUTH_JWKS_URL));

export async function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new HttpError(401, "Missing bearer token");

    const token = header.slice(7).trim();
    const { payload } = await jwtVerify(token, jwks, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    const subject = typeof payload.sub === "string" ? payload.sub : payload.id ?? payload.userId;
    if (typeof subject !== "string" || !subject) throw new HttpError(401, "Token has no valid user identity");

    const db = getDatabase();
    const userCollection = db.collection(env.AUTH_USER_COLLECTION);
    const identities = [{ id: subject }, { _id: subject }];
    if (ObjectId.isValid(subject)) identities.push({ _id: new ObjectId(subject) });

    const user = await userCollection.findOne({ $or: identities });
    if (!user) throw new HttpError(401, "Authenticated user does not exist");

    req.user = {
      id: user.id || (user._id ? String(user._id) : subject),
      mongoId: user._id,
      email: user.email,
      name: user.name,
      role: typeof user.role === "string" ? user.role : "customer",
    };
    next();
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    const code = error?.code;
    const message = code === "ERR_JWT_EXPIRED" ? "Token has expired" : "Invalid or unverifiable token";
    next(new HttpError(401, message));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, "You do not have permission to access this resource"));
    }
    next();
  };
}

export const verifyRenter = requireRole("customer");
export const verifyOwner = requireRole("owner");
export const verifyAdmin = requireRole("admin");
