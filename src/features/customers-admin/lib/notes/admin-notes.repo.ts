import { connectDB } from "@/shared/db";
import AdminNote from "@/features/customers-admin/model/AdminNote";
import type { AdminNoteDoc } from "@/features/customers-admin/lib/notes/admin-note.types";

/** Hard cap so one customer can never produce an unbounded notes query. */
export const ADMIN_NOTES_LIMIT = 200;

export async function listAdminNotes(emailLower: string): Promise<AdminNoteDoc[]> {
  await connectDB();
  return AdminNote.find({ emailLower, deletedAt: null })
    .sort({ createdAt: -1, _id: -1 })
    .limit(ADMIN_NOTES_LIMIT)
    .lean<AdminNoteDoc[]>();
}

export async function createAdminNote(input: {
  emailLower: string;
  authorId: string;
  authorName: string;
  text: string;
}): Promise<AdminNoteDoc> {
  await connectDB();
  const doc = await AdminNote.create({
    emailLower: input.emailLower,
    authorId: input.authorId,
    authorName: input.authorName,
    text: input.text,
    deletedAt: null,
  });
  return doc.toObject() as AdminNoteDoc;
}

export async function findAdminNote(
  emailLower: string,
  noteId: string,
): Promise<AdminNoteDoc | null> {
  await connectDB();
  return AdminNote.findOne({
    _id: noteId,
    emailLower,
    deletedAt: null,
  }).lean<AdminNoteDoc | null>();
}

export async function updateAdminNoteText(
  noteId: string,
  text: string,
): Promise<AdminNoteDoc | null> {
  await connectDB();
  return AdminNote.findOneAndUpdate(
    { _id: noteId, deletedAt: null },
    { $set: { text } },
    { new: true },
  ).lean<AdminNoteDoc | null>();
}

export async function softDeleteAdminNote(noteId: string): Promise<boolean> {
  await connectDB();
  const result = await AdminNote.updateOne(
    { _id: noteId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
  );
  return (result.modifiedCount ?? 0) > 0;
}
