import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import { Partner } from "@/models/partner";
import { Booking } from "@/models/booking";
import { authOptions } from "@/lib/auth/options";

/**
 * Recalculate a partner's payout balance based on completed bookings
 * This endpoint accounts for bookings where the date has passed (even if status != "completed")
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const partner = await Partner.findById(id);

    if (!partner) {
      return NextResponse.json({ success: false, error: "Partner not found" }, { status: 404 });
    }

    console.log(`🔄 Recalculating payout for partner: ${partner.name} (${partner.email})`);

    // Find all completed bookings assigned to this partner
    const now = new Date();
    const completedBookings = await Booking.find({
      $and: [
        {
          $or: [
            { "assignedPartner._id": partner._id },
            { "assignedPartner._id": partner._id.toString() },
          ],
        },
        {
          $or: [
            { status: "completed" },
            {
              // Also include bookings where date has passed and payment is complete
              date: { $lt: now.toISOString().split("T")[0] },
              status: { $ne: "canceled" },
            },
          ],
        },
      ],
    });

    console.log(`📦 Found ${completedBookings.length} completed bookings for partner`);

    // Calculate earnings
    let totalEarnings = 0;
    let onlineEarnings = 0;
    let cashEarnings = 0;
    let payoutBalance = 0;

    for (const booking of completedBookings) {
      const amount =
        typeof booking.partnerPayoutAmount === "number"
          ? booking.partnerPayoutAmount
          : typeof booking.totalAmount === "number"
          ? booking.totalAmount
          : 0;

      if (amount <= 0) continue;

      const isCashBooking = booking.paymentMethod === "cash";
      const isPaymentComplete =
        isCashBooking || booking.paymentStatus === "completed";

      if (isPaymentComplete) {
        totalEarnings += amount;

        if (isCashBooking) {
          cashEarnings += amount;
        } else {
          onlineEarnings += amount;
          // Only online earnings contribute to payout balance (initially)
          payoutBalance += amount;
        }
      }
    }

    // Round to 2 decimal places
    totalEarnings = Math.round(totalEarnings * 100) / 100;
    onlineEarnings = Math.round(onlineEarnings * 100) / 100;
    cashEarnings = Math.round(cashEarnings * 100) / 100;
    payoutBalance = Math.round(payoutBalance * 100) / 100;

    console.log(`💰 Calculated earnings:`, {
      totalEarnings,
      onlineEarnings,
      cashEarnings,
      payoutBalance: "before lastPayoutAt adjustment",
    });

    // Check if partner was already paid
    if (partner.lastPayoutAt) {
      console.log(`ℹ️  Partner has payout history (last: ${partner.lastPayoutAt.toISOString()})`);
      console.log(`     Checking for bookings completed after last payout...`);

      // Only count bookings completed after the last payout
      payoutBalance = 0;

      for (const booking of completedBookings) {
        const bookingCompletedAt = booking.updatedAt || booking.createdAt;
        if (bookingCompletedAt <= partner.lastPayoutAt) {
          continue; // Skip bookings completed before last payout
        }

        const amount =
          typeof booking.partnerPayoutAmount === "number"
            ? booking.partnerPayoutAmount
            : typeof booking.totalAmount === "number"
            ? booking.totalAmount
            : 0;

        if (amount <= 0) continue;

        const isCashBooking = booking.paymentMethod === "cash";
        const isPaymentComplete =
          isCashBooking || booking.paymentStatus === "completed";

        if (isPaymentComplete && !isCashBooking) {
          payoutBalance += amount;
        }
      }

      payoutBalance = Math.round(payoutBalance * 100) / 100;
      console.log(`     Outstanding Payout (after last payout): €${payoutBalance.toFixed(2)}`);
    }

    // Update partner
    partner.totalEarnings = totalEarnings;
    partner.onlineEarnings = onlineEarnings;
    partner.cashEarnings = cashEarnings;
    partner.payoutBalance = payoutBalance;

    await partner.save();

    console.log(`✅ Partner payout recalculated successfully`, {
      partnerId: partner._id,
      totalEarnings,
      onlineEarnings,
      cashEarnings,
      payoutBalance,
    });

    return NextResponse.json(
      {
        success: true,
        partner,
        summary: {
          totalEarnings,
          onlineEarnings,
          cashEarnings,
          payoutBalance,
          bookingsProcessed: completedBookings.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error recalculating partner payout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to recalculate payout" },
      { status: 500 }
    );
  }
}
