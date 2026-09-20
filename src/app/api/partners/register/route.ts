import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { sendAdminPartnerRegistrationEmail } from "@/features/partners/email/partner-notification";
import { sanitizeInput } from "@/shared/lib/validation";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { partnerRegisterSchema } from "@/features/partners/schema/partner-write.schema";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, partnerRegisterSchema);
    if (!parsed.ok) return parsed.response;
    const { name, email, password, phone, address, city, country } = parsed.data;

    await connectDB();
    const existingPartner = await Partner.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingPartner) {
      return jsonError("conflict", 409);
    }

    const partner = await Partner.create({
      name: sanitizeInput(name.trim()),
      email: email.toLowerCase().trim(),
      password: await hash(password, 10),
      phone: phone?.trim(),
      address: address ? sanitizeInput(address.trim()) : undefined,
      city: city ? sanitizeInput(city.trim()) : undefined,
      country: country ? sanitizeInput(country.trim()) : undefined,
      status: "pending",
      documents: [],
      isActive: true,
    });

    const baseUrl =
      request.headers.get("origin") ||
      request.headers.get("referer")?.split("/").slice(0, 3).join("/") ||
      process.env.NEXT_PUBLIC_BASE_URL;

    try {
      await sendAdminPartnerRegistrationEmail({
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        city: partner.city,
        country: partner.country,
        baseUrl,
      });
    } catch (emailError) {
      console.error("Partner registration email failed:", emailError);
    }

    return NextResponse.json(
      { success: true, partnerId: partner._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Partner register failed:", error);
    return jsonError("internal_error", 500);
  }
}
