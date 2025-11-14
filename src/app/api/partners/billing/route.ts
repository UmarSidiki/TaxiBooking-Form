import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { connectDB } from "@/lib/database";
import { Partner } from "@/models/partner";
import { authOptions } from "@/lib/auth/options";

const sanitizeString = (value: unknown, limit = 180) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, limit);
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "partner") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const partner = await Partner.findById(session.user.id).select("-password");

    if (!partner) {
      return NextResponse.json({ success: false, error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        billingDetails: partner.billingDetails || {},
        payoutBalance: partner.payoutBalance || 0,
        lastPayoutAt: partner.lastPayoutAt || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching partner billing details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load billing details" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "partner") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const payload = await request.json();
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    const sanitizedBilling = {
      accountHolder: sanitizeString(payload.accountHolder, 120),
      bankName: sanitizeString(payload.bankName, 120),
      accountNumber: sanitizeString(payload.accountNumber, 60),
      iban: sanitizeString(payload.iban, 64),
      swift: sanitizeString(payload.swift, 60),
      notes: sanitizeString(payload.notes, 500),
    };

    const normalizedBilling = Object.entries(sanitizedBilling).reduce(
      (acc, [key, value]) => {
        if (typeof value === "string") {
          acc[key as keyof typeof sanitizedBilling] = value;
        }
        return acc;
      },
      {} as Partial<Record<keyof typeof sanitizedBilling, string>>
    );

    const updatedPartner = await Partner.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          billingDetails: normalizedBilling,
        },
      },
      {
        new: true,
        runValidators: true,
        select: "-password",
      }
    );

    if (!updatedPartner) {
      return NextResponse.json({ success: false, error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        billingDetails: updatedPartner.billingDetails || {},
        payoutBalance: updatedPartner.payoutBalance || 0,
        lastPayoutAt: updatedPartner.lastPayoutAt || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating partner billing details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save billing details" },
      { status: 500 }
    );
  }
}
