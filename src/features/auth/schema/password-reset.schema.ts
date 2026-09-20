import { z } from "zod";
import { isValidEmail } from "@/shared/lib/validation";

export const requestResetSchema = z.object({
  email: z.string().trim().refine(isValidEmail),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().refine(isValidEmail),
  otp: z.string().trim().min(4).max(12),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().refine(isValidEmail),
  otp: z.string().trim().min(4).max(12),
  newPassword: z.string().min(8),
});

export const createAdminSchema = z.object({
  email: z.string().trim().refine(isValidEmail),
  password: z.string().min(8),
  name: z.string().trim().min(1),
  role: z.enum(["admin", "superadmin"]).optional().default("admin"),
});
