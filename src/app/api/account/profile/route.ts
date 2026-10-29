import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/shared/db";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import { readCustomerToken } from "@/features/customers/lib/customer-token";

const profileSchema = z.object({
  name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(32).optional(),
  whatsappOptIn: z.boolean().optional(),
  savedAddresses: z
    .object({
      home: z.string().trim().max(240).optional(),
      work: z.string().trim().max(240).optional(),
      airport: z.string().trim().max(240).optional(),
    })
    .optional(),
  language: z.string().trim().min(2).max(8).optional(),
});

async function emailFromRequest(request: Request) {
  const jar = await cookies();
  return readCustomerToken(
    new URL(request.url).searchParams.get("token") ||
      jar.get("customer_session")?.value,
  );
}

export async function GET(request: Request) {
  const email = await emailFromRequest(request);
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await connectDB();
  const doc = await CustomerProfile.findOne({ email }).lean();
  return NextResponse.json({ email, profile: doc ?? null });
}

export async function PATCH(request: Request) {
  const email = await emailFromRequest(request);
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  await connectDB();
  const update: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.phone !== undefined) update.phone = parsed.data.phone;
  if (parsed.data.whatsappOptIn !== undefined) update.whatsappOptIn = parsed.data.whatsappOptIn;
  if (parsed.data.savedAddresses !== undefined) update.savedAddresses = parsed.data.savedAddresses;
  if (parsed.data.language !== undefined) update.language = parsed.data.language;
  const doc = await CustomerProfile.findOneAndUpdate(
    { email },
    { $set: { email, ...update } },
    { upsert: true, new: true },
  ).lean();
  return NextResponse.json({ ok: true, profile: doc });
}