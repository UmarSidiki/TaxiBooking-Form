import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth";
import { connectDB } from "@/shared/db";
import { e164PhoneSchema } from "@/shared/schema/e164-phone";
import { checkWhatsAppNumber } from "@/features/settings/lib/check-whatsapp-number";
import { Partner } from "@/features/partners/model";
import { Driver } from "@/features/drivers/model";
import { jsonError } from "@/shared/http/json-error";

const bodySchema = z.object({ phone: e164PhoneSchema });

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user || (role !== "driver" && role !== "partner" && role !== "admin")) {
      return jsonError("unauthorized", 401);
    }
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError("invalid_body", 400);

    await connectDB();
    const result = await checkWhatsAppNumber(parsed.data.phone);
    if (result.connected && result.onWhatsApp && role === "partner") {
      await Partner.updateOne({ _id: session.user.id }, { $set: { phone: parsed.data.phone, whatsappVerified: true } });
    }
    if (result.connected && result.onWhatsApp && role === "driver") {
      await Driver.updateOne({ _id: session.user.id }, { $set: { phone: parsed.data.phone, whatsappVerified: true } });
    }
    return NextResponse.json({ success: true, ...result, phone: parsed.data.phone });
  } catch (error) {
    console.error("WhatsApp number check failed:", error);
    return jsonError("internal_error", 500);
  }
}
