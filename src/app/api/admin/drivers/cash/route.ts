import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function GET() {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;
    await connectDB();
    const rows = await Booking.aggregate<{
      _id: mongoose.Types.ObjectId;
      name?: string;
      cashCollected: number;
      rides: number;
    }>([
      { $match: { cashCollected: { $gt: 0 }, "assignedDriver._id": { $exists: true } } },
      {
        $group: {
          _id: "$assignedDriver._id",
          name: { $first: "$assignedDriver.name" },
          cashCollected: { $sum: "$cashCollected" },
          rides: { $sum: 1 },
        },
      },
      { $sort: { cashCollected: -1 } },
      { $limit: 200 },
    ]);
    return NextResponse.json({
      success: true,
      drivers: rows.map((row) => ({
        driverId: String(row._id),
        name: row.name ?? "",
        cashCollected: row.cashCollected,
        rides: row.rides,
      })),
    });
  } catch (error) {
    console.error("Driver cash summary failed:", error);
    return jsonError("internal_error", 500);
  }
}
