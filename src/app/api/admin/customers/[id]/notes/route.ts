import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { customerExists } from "@/features/customers-admin/lib/customer-profile/customer-profile.repo";
import { createAdminNote, listAdminNotes } from "@/features/customers-admin/lib/notes/admin-notes.repo";
import { toAdminNoteRow } from "@/features/customers-admin/lib/notes/admin-note-mappers";
import { recordAdminAudit } from "@/features/customers-admin/lib/audit/record-admin-audit";
import { customerProfileParamSchema } from "@/features/customers-admin/schema/customer-profile.schema";
import { adminNoteBodySchema } from "@/features/customers-admin/schema/admin-note.schema";
import { jsonError } from "@/shared/http/json-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await params;
    const parsed = customerProfileParamSchema.safeParse(id);
    if (!parsed.success) return jsonError("invalid_query", 400);
    if (!(await customerExists(parsed.data))) return jsonError("not_found", 404);

    const notes = await listAdminNotes(parsed.data);
    return NextResponse.json({
      success: true,
      notes: notes.map((note) => toAdminNoteRow(note, access.session.user.id)),
    });
  } catch (error) {
    console.error("Admin customer notes list failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await params;
    const email = customerProfileParamSchema.safeParse(id);
    if (!email.success) return jsonError("invalid_query", 400);

    const body = await request.json().catch(() => null);
    const parsed = adminNoteBodySchema.safeParse(body);
    if (!parsed.success) return jsonError("invalid_body", 400);
    if (!(await customerExists(email.data))) return jsonError("not_found", 404);

    const note = await createAdminNote({
      emailLower: email.data,
      authorId: access.session.user.id,
      authorName: access.session.user.name ?? "",
      text: parsed.data.text,
    });

    await recordAdminAudit({
      actor: access.session.user,
      action: "customer.note.create",
      targetType: "customer",
      targetId: email.data,
      metadata: { noteId: String(note._id), length: note.text.length },
      request,
    });

    return NextResponse.json(
      { success: true, note: toAdminNoteRow(note, access.session.user.id) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin customer note create failed:", error);
    return jsonError("internal_error", 500);
  }
}
