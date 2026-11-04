import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_ID_PATTERN = /^[a-f\d]{24}$/i;

export const customerProfileParamSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .refine((value) => EMAIL_PATTERN.test(value));

export const customerSessionIdParamSchema = z
  .string()
  .trim()
  .refine((value) => SESSION_ID_PATTERN.test(value));
