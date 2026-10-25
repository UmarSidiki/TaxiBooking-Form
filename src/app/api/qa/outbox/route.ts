import { NextResponse } from "next/server";
import { readQaMail } from "@/features/settings/lib/email-outbox";
import { readWhatsAppOutbox } from "@/features/settings/lib/whatsapp-outbox";

function enabled() {
  return process.env.QA_MOCK_EMAIL === "1" || process.env.QA_MOCK_WHATSAPP === "1";
}

export async function GET(request: Request) {
  if (!enabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (request.headers.get("x-qa-key") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const mail = readQaMail().map((item) => {
    const attachments = Array.isArray(item.attachments) ? item.attachments : [];
    return {
      to: item.to,
      subject: item.subject,
      attachments: attachments.map((file) => {
        const content = "content" in file ? file.content : undefined;
        const bytes = Buffer.isBuffer(content) ? content : Buffer.from([]);
        return {
          filename: "filename" in file ? file.filename : "",
          bytes: bytes.length,
          pdf: bytes.subarray(0, 4).toString() === "%PDF",
        };
      }),
    };
  });
  const whatsapp = readWhatsAppOutbox().map((item) => {
    const bytes = item.document ? Buffer.from(item.document.base64, "base64") : Buffer.from([]);
    return {
      fileName: item.document?.fileName,
      pdf: bytes.subarray(0, 4).toString() === "%PDF",
    };
  });
  return NextResponse.json({ mail, whatsapp });
}
