import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { buildInvoicePdf } from "@/features/invoices/lib/build-invoice-pdf";
import { sendInvoiceNotice } from "@/features/invoices/lib/send-invoice-notice";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const { tripId } = await params;
  const built = await buildInvoicePdf(tripId);
  if (!built) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return new NextResponse(new Uint8Array(built.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${built.invoiceNumber || tripId}.pdf"`,
    },
  });
}

export async function POST(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const { tripId } = await params;
  const sent = await sendInvoiceNotice(tripId, true);
  if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 404 });
  return NextResponse.json({ ok: true });
}
