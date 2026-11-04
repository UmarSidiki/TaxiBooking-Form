import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/shared/db";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import {
  applyCustomerSessionCookie,
  readCustomerSession,
} from "@/features/customers/lib/customer-session";
import { applyMarketingConsent } from "@/features/marketing/lib/consent/apply-marketing-consent";
import { isMarketingEnabled } from "@/features/marketing/lib/marketing-module";
import { auditIpPrefix } from "@/features/customers-admin/lib/audit/record-admin-audit";

const profileSchema = z.object({
  name: z.string().trim().max(120).optional(),
  whatsappOptIn: z.boolean().optional(),
  marketingEmailOptIn: z.boolean().optional(),
  marketingWhatsappOptIn: z.boolean().optional(),
  savedAddresses: z
    .object({
      home: z.string().trim().max(240).optional(),
      work: z.string().trim().max(240).optional(),
      airport: z.string().trim().max(240).optional(),
    })
    .optional(),
  language: z.string().trim().min(2).max(8).optional(),
});

export async function GET(request: Request) {
  const session = await readCustomerSession(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await connectDB();
  const doc = await CustomerProfile.findOne({ email: session.email }).lean();
  return applyCustomerSessionCookie(
    NextResponse.json({ email: session.email, profile: doc ?? null }),
    session,
  );
}

export async function PATCH(request: Request) {
  const session = await readCustomerSession(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const grantsMarketing =
    parsed.data.marketingEmailOptIn === true || parsed.data.marketingWhatsappOptIn === true;
  // Withdrawing consent always works; new opt-ins need the Marketing module on.
  if (grantsMarketing && !(await isMarketingEnabled())) {
    return NextResponse.json({ error: "module_disabled" }, { status: 403 });
  }
  await connectDB();
  const update: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.whatsappOptIn !== undefined) update.whatsappOptIn = parsed.data.whatsappOptIn;
  if (parsed.data.savedAddresses !== undefined) update.savedAddresses = parsed.data.savedAddresses;
  if (parsed.data.language !== undefined) update.language = parsed.data.language;
  const doc = await CustomerProfile.findOneAndUpdate(
    { email: session.email },
    { $set: { email: session.email, ...update } },
    { upsert: true, new: true },
  ).lean();

  const ipPrefix = auditIpPrefix(request);
  const consentChanges: Array<{ channel: "email" | "whatsapp"; granted: boolean }> = [];
  if (parsed.data.marketingEmailOptIn !== undefined) {
    consentChanges.push({
      channel: "email",
      granted: parsed.data.marketingEmailOptIn,
    });
  }
  if (parsed.data.marketingWhatsappOptIn !== undefined) {
    consentChanges.push({
      channel: "whatsapp",
      granted: parsed.data.marketingWhatsappOptIn,
    });
  }

  for (const change of consentChanges) {
    await applyMarketingConsent({
      email: session.email,
      channel: change.channel,
      status: change.granted ? "granted" : "withdrawn",
      source: "account",
      ipPrefix,
    });
  }

  const current =
    consentChanges.length > 0
      ? await CustomerProfile.findOne({ email: session.email }).lean()
      : doc;

  return applyCustomerSessionCookie(
    NextResponse.json({ ok: true, profile: current }),
    session,
  );
}
