import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import {
  findAdminNote,
  softDeleteAdminNote,
  updateAdminNoteText,
} from "@/features/customers-admin/lib/notes/admin-notes.repo";
import { toAdminNoteRow } from "@/features/customers-admin/lib/notes/admin-note-mappers";
import { recordAdminAudit } from "@/features/customers-admin/lib/audit/record-admin-audit";
import { customerProfileParamSchema } from "@/features/customers-admin/schema/customer-profile.schema";
import {
  adminNoteBodySchema,
  adminNoteIdParamSchema,
} from "@/features/customers-admin/schema/admin-note.schema";
import { jsonError } from "@/shared/http/json-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string; noteId: string }> };

async function loadNote(id: string, noteId: string) {
  const email = customerProfileParamSchema.safeParse(id);
  const note = adminNoteIdParamSchema.safeParse(noteId);
  if (!email.success || !note.success) {
    return { ok: false as const, response: jsonError("invalid_query", 400) };
  }
  const row = await findAdminNote(email.data, note.data);
  if (!row) return { ok: false as const, response: jsonError("not_found", 404) };
  return { ok: true as const, email: email.data, note: row };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id, noteId } = await params;
    const found = await loadNote(id, noteId);
    if (!found.ok) return found.response;
    if (found.note.authorId !== access.session.user.id) {
      return jsonError("forbidden", 403);
    }

    const body = await request.json().catch(() => null);
    const parsed = adminNoteBodySchema.safeParse(body);
    if (!parsed.success) return jsonError("invalid_body", 400);

    const updated = await updateAdminNoteText(String(found.note._id), parsed.data.text);
    if (!updated) return jsonError("not_found", 404);

    await recordAdminAudit({
      actor: access.session.user,
      action: "customer.note.update",
      targetType: "customer",
      targetId: found.email,
      metadata: { noteId: String(updated._id), length: updated.text.length },
      request,
    });

    return NextResponse.json({
      success: true,
      note: toAdminNoteRow(updated, access.session.user.id),
    });
  } catch (error) {
    console.error("Admin customer note update failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id, noteId } = await params;
    const found = await loadNote(id, noteId);
    if (!found.ok) return found.response;
    if (found.note.authorId !== access.session.user.id) {
      return jsonError("forbidden", 403);
    }

    const deleted = await softDeleteAdminNote(String(found.note._id));
    if (!deleted) return jsonError("not_found", 404);

    await recordAdminAudit({
      actor: access.session.user,
      action: "customer.note.delete",
      targetType: "customer",
      targetId: found.email,
      metadata: { noteId: String(found.note._id), length: found.note.text.length },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin customer note delete failed:", error);
    return jsonError("internal_error", 500);
  }
}
