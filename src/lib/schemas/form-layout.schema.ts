/**
 * Zod schemas for form layout validation
 */

import { z } from 'zod';

// Booking field types
const BOOKING_FIELD_TYPES = [
  "booking-type",
  "pickup",
  "dropoff",
  "stops",
  "trip-type",
  "date",
  "time",
  "return-date",
  "return-time",
  "passengers",
  "duration",
  "search-button",
] as const;

// Field schema
const FormFieldSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(BOOKING_FIELD_TYPES),
  label: z.string().min(1).max(100),
  placeholder: z.string().max(200).optional(),
  required: z.boolean(),
  enabled: z.boolean(),
  width: z.enum(['full', 'half', 'third']),
  order: z.number().int().min(0).max(100),
  step: z.literal(1),
  visibleWhen: z.object({
    bookingType: z.enum(['destination', 'hourly']).optional(),
    tripType: z.literal('roundtrip').optional(),
  }).optional(),
});

// Style schema with strict validation
const FormStyleSchema = z.object({
  // Container
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$|^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[0-9.]+\s*)?\)$/),
  backgroundOpacity: z.number().int().min(0).max(100),
  glassEffect: z.boolean(),
  borderRadius: z.string().regex(/^\d+(\.\d+)?(px|rem|em)$/),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$|^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[0-9.]+\s*)?\)$/),
  borderWidth: z.string().regex(/^\d+(px)$/),
  
  // Typography
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$|^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[0-9.]+\s*)?\)$/),
  headingColor: z.string().regex(/^#[0-9A-Fa-f]{6}$|^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[0-9.]+\s*)?\)$/),
  labelColor: z.string().regex(/^#[0-9A-Fa-f]{6}$|^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[0-9.]+\s*)?\)$/),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$|^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[0-9.]+\s*)?\)$/),
  fontFamily: z.string().max(100).optional(),
  
  // Header & Footer
  showHeader: z.boolean(),
  headingText: z.string().min(0).max(200),
  subHeadingText: z.string().max(200).optional(),
  headingAlignment: z.enum(['left', 'center', 'right']),
  showFooter: z.boolean(),
  footerText: z.string().min(0).max(500),
  showSteps: z.boolean(),
  showFooterImages: z.boolean(),
  columns: z.number().int().min(1).max(4),
  
  // Submit Button
  buttonText: z.string().min(1).max(50),
  buttonColor: z.string().regex(/^#[0-9A-Fa-f]{6}$|^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[0-9.]+\s*)?\)$/),
  buttonTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$|^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[0-9.]+\s*)?\)$/),
  buttonWidth: z.enum(['full', 'auto', 'half']),
  buttonAlignment: z.enum(['left', 'center', 'right']),
  
  // Components
  inputBackgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$|^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[0-9.]+\s*)?\)$/),
  inputBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$|^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[0-9.]+\s*)?\)$/),
  inputTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$|^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[0-9.]+\s*)?\)$/),
});

// Form layout schema
export const FormLayoutCreateSchema = z.object({
  name: z.string().min(1, 'Layout name is required').max(100, 'Name too long'),
  description: z.string().max(500).optional(),
  fields: z.array(FormFieldSchema).max(50, 'Too many fields'),
  style: FormStyleSchema.optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const FormLayoutUpdateSchema = FormLayoutCreateSchema.partial().extend({
  isDefault: z.boolean().optional(),
});

export type FormLayoutCreateInput = z.infer<typeof FormLayoutCreateSchema>;
export type FormLayoutUpdateInput = z.infer<typeof FormLayoutUpdateSchema>;
