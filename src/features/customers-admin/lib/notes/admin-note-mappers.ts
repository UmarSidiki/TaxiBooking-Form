import type {
  AdminNoteDoc,
  AdminNoteRow,
} from "@/features/customers-admin/lib/notes/admin-note.types";

export function toAdminNoteRow(doc: AdminNoteDoc, viewerId: string): AdminNoteRow {
  return {
    id: String(doc._id),
    email: doc.emailLower,
    authorId: doc.authorId,
    authorName: (doc.authorName ?? "").trim(),
    text: doc.text,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    canEdit: Boolean(viewerId) && doc.authorId === viewerId,
  };
}
