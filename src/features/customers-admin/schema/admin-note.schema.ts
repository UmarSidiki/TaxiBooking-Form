import { z } from "zod";

import { ADMIN_NOTE_MAX_LENGTH } from "@/features/customers-admin/lib/notes/admin-note.constants";
import { isObjectIdString } from "@/features/customers-admin/lib/object-id";

export const adminNoteIdParamSchema = z
  .string()
  .trim()
  .refine(isObjectIdString);

const adminNoteTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(ADMIN_NOTE_MAX_LENGTH);

export const adminNoteBodySchema = z.object({
  text: adminNoteTextSchema,
});

export type AdminNoteBody = z.infer<typeof adminNoteBodySchema>;
