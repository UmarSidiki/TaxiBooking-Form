import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/lib/require-role";
import PricingRule from "@/features/pricing/model/PricingRule";
import PromoCode from "@/features/pricing/model/PromoCode";
import ZonePrice from "@/features/pricing/model/ZonePrice";
import {
  pricingRuleWriteSchema,
  promoWriteSchema,
  zonePriceWriteSchema,
} from "@/features/pricing/schema/pricing-write.schema";
import { connectDB } from "@/shared/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  await connectDB();
  const [rule, zones, promos] = await Promise.all([
    PricingRule.findOne().lean(),
    ZonePrice.find().sort({ fromLabel: 1 }).limit(200).lean(),
    PromoCode.find().sort({ code: 1 }).limit(200).lean(),
  ]);
  return NextResponse.json({ rule, zones, promos });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const parsed = pricingRuleWriteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  await connectDB();
  const rule = await PricingRule.findOneAndUpdate({}, parsed.data, { upsert: true, new: true });
  return NextResponse.json({ rule });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const body = await request.json().catch(() => null);
  await connectDB();
  if (body?.kind === "zone") {
    const parsed = zonePriceWriteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    const zone = await ZonePrice.findOneAndUpdate(
      { fromLabel: parsed.data.fromLabel, toLabel: parsed.data.toLabel },
      parsed.data,
      { upsert: true, new: true },
    );
    return NextResponse.json({ zone });
  }
  const parsed = promoWriteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const promo = await PromoCode.findOneAndUpdate(
    { code: parsed.data.code.toUpperCase() },
    {
      ...parsed.data,
      code: parsed.data.code.toUpperCase(),
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
    { upsert: true, new: true },
  );
  return NextResponse.json({ promo });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const id = url.searchParams.get("id") ?? "";
  if ((kind !== "zone" && kind !== "promo") || !/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  await connectDB();
  const removed =
    kind === "zone" ? await ZonePrice.findByIdAndDelete(id) : await PromoCode.findByIdAndDelete(id);
  if (!removed) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
