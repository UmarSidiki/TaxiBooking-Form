import { z } from "zod";
import { isValidEmail, isValidPhone } from "@/shared/lib/validation";
import { mongoIdSchema } from "@/shared/schema/mongo-id";

export const partnerRegisterSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().refine(isValidEmail),
  password: z.string().min(8),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isValidPhone(value)),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export const partnerBillingSchema = z.object({
  accountHolder: z.string().max(120).optional(),
  bankName: z.string().max(120).optional(),
  accountNumber: z.string().max(60).optional(),
  iban: z.string().max(64).optional(),
  swift: z.string().max(60).optional(),
  notes: z.string().max(500).optional(),
});

export const vehicleIdBodySchema = z.object({
  vehicleId: mongoIdSchema,
});

export const reasonBodySchema = z.object({
  reason: z.string().trim().min(1).max(2000),
});

export const fleetRejectBodySchema = z.object({
  reason: z.string().trim().min(1).max(2000),
  vehicleId: mongoIdSchema,
});

export const partnerDocumentSchema = z.object({
  type: z.string().min(1),
  fileName: z.string().min(1).max(200),
  fileData: z.string().startsWith("data:"),
  mimeType: z.enum([
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ]),
  fileSize: z.number().int().positive().max(8 * 1024 * 1024),
});
