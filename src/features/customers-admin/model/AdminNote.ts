import mongoose, { Schema, Document } from "mongoose";

import { ADMIN_NOTE_MAX_LENGTH } from "@/features/customers-admin/lib/notes/admin-note.constants";

export interface IAdminNote extends Document {
  emailLower: string;
  authorId: string;
  authorName: string;
  /** Stored verbatim and always rendered as text, never as HTML. */
  text: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AdminNoteSchema = new Schema(
  {
    emailLower: { type: String, required: true },
    authorId: { type: String, required: true },
    authorName: { type: String, default: "" },
    text: { type: String, required: true, maxlength: ADMIN_NOTE_MAX_LENGTH },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

AdminNoteSchema.index({ emailLower: 1, deletedAt: 1, createdAt: -1 });
AdminNoteSchema.index({ authorId: 1, createdAt: -1 });

const AdminNote =
  mongoose.models.AdminNote ||
  mongoose.model<IAdminNote>("AdminNote", AdminNoteSchema);

export default AdminNote;
