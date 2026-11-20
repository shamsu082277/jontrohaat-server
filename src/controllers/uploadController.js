import { env } from "../config/env.js";
import { HttpError, success } from "../utils/http.js";

function isValidImage(file) {
  const bytes = file.buffer;
  if (file.mimetype === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (file.mimetype === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.mimetype === "image/webp") return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  return false;
}

export async function uploadImage(req, res) {
  if (!env.IMGBB_API_KEY || env.IMGBB_API_KEY === "your_imgbb_api_key") {
    throw new HttpError(503, "Image upload is not configured");
  }
  if (!req.file || !isValidImage(req.file)) throw new HttpError(400, "Upload a valid PNG, JPEG, or WEBP image");

  const form = new URLSearchParams({
    image: req.file.buffer.toString("base64"),
    name: req.file.originalname.replace(/[^\w.-]/g, "_").slice(0, 100),
  });
  let response;
  try {
    response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(env.IMGBB_API_KEY)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new HttpError(502, "Image hosting service is unavailable");
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success || typeof result?.data?.url !== "string") {
    throw new HttpError(502, "Image could not be uploaded");
  }
  success(res, "Image uploaded", { url: result.data.url, display_url: result.data.display_url || result.data.url }, 201);
}
