import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const secureImageUrl = z.string().trim().url().refine(
  (value) => new URL(value).protocol === "https:",
  "Image URLs must use HTTPS"
);
const optionalImageUrl = secureImageUrl.or(z.literal(""));
const imageFields = {
  image: optionalImageUrl.optional(),
  images: z.array(secureImageUrl).max(10).optional(),
};

function normalizeEquipmentImages(data, defaultToEmpty = false) {
  if (!("image" in data) && !("images" in data)) {
    return defaultToEmpty ? { ...data, image: "", images: [] } : data;
  }
  const images = data.images ?? (data.image ? [data.image] : []);
  return { ...data, image: images[0] || "", images };
}

const equipmentFields = {
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(4000),
  category: z.string().trim().min(1).max(80),
  location: z.union([
    z.string().trim().min(1).max(200),
    z.object({
      division: z.string().trim().min(1).max(80),
      district: z.string().trim().min(1).max(80),
      upazila: z.string().trim().max(80).optional(),
      address: z.string().trim().max(300).optional(),
    }),
  ]),
  rentalPrice: z.coerce.number().positive(),
  rentalType: z.enum(["per_day", "per_hour", "per_acre"]),
  availableQuantity: z.coerce.number().int().min(0),
  condition: z.string().trim().min(1).max(80),
  brand: z.string().trim().max(80).optional(),
  model: z.string().trim().max(80).optional(),
  ...imageFields,
  rentalTerms: z.string().trim().max(2000).optional(),
};

export const equipmentCreateSchema = z.object(equipmentFields).strict()
  .transform((data) => normalizeEquipmentImages(data, true));

export const equipmentUpdateSchema = z.object(equipmentFields).partial().strict()
  .transform((data) => normalizeEquipmentImages(data));

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(6).max(30).optional(),
  address: z.string().trim().max(300).optional(),
  district: z.string().trim().max(80).optional(),
  division: z.string().trim().max(80).optional(),
  image: optionalImageUrl.optional(),
}).strict();

export const roleSchema = z.object({ role: z.enum(["customer", "owner", "admin"]) }).strict();
export const statusSchema = z.object({ status: z.enum(["approved", "rejected"]) }).strict();
export const confirmSchema = z.object({ confirm: z.literal(true) }).strict();

export const bookingCreateSchema = z.object({
  equipmentId: objectId,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  quantity: z.coerce.number().int().positive(),
  areaAcres: z.coerce.number().positive().optional(),
  contactNumber: z.string().trim().min(6).max(30),
  deliveryAddress: z.string().trim().min(5).max(300),
  notes: z.string().trim().max(1000).optional(),
}).strict();

export const checkoutSchema = z.object({ bookingId: objectId }).strict();
export const bookingStatusSchema = z.object({ bookingStatus: z.enum(["confirmed", "active", "completed", "cancelled"]) }).strict();
