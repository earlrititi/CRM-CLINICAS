import { z } from "zod";

const emptyToUndefined = z.preprocess((value) => {
  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  return value;
}, z.string().trim().optional());

const optionalEmail = z.preprocess((value) => {
  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  return value;
}, z.string().trim().email().max(160).optional());

const optionalUuid = z.preprocess((value) => {
  if (typeof value === "string" && value.trim().length === 0) {
    return null;
  }

  return value;
}, z.string().uuid().nullable());

export const publicBookingSchema = z
  .object({
    bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    clinicSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    communicationsConsent: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
    email: optionalEmail,
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(120),
    phone: emptyToUndefined,
    professionalId: optionalUuid,
    serviceId: z.string().uuid(),
    startsAt: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid date"),
    website: z.string().max(0).optional(),
  })
  .refine((value) => Boolean(value.email || value.phone), {
    message: "Email or phone is required",
    path: ["email"],
  });

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;
