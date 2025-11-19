/**
 * Migration script to recalculate all partner payout balances
 * This script accounts for bookings where the date has passed, not just explicitly marked as "completed"
 *
 * Usage:
 *   bun run scripts/recalculate-all-partner-payouts.ts
 */

import { connectDB } from "../src/lib/database";
import { Partner } from "../src/models/partner";
import { Booking } from "../src/models/booking";

async function recalculateAllPartnerPayouts() {
  try {
    console.log("🔄 Connecting to database...");
    await connectDB();

    console.log("📊 Fetching all approved partners...");
    const partners = await Partner.find({ status: "approved" });
    console.log(`Found ${partners.length} approved partners\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const partner of partners) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🔍 Processing partner: ${partner.name} (${partner.email})`);
      console.log(`   Partner ID: ${partner._id.toString()}`);

      const now = new Date();

      // Find all completed bookings assigned to this partner
      // This includes both explicitly completed AND bookings where date has passed
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
                // Include bookings where date has passed and payment is complete
                date: { $lt: now.toISOString().split("T")[0] },
                status: { $ne: "canceled" },
              },
            ],
          },
        ],
      });

      if (completedBookings.length === 0) {
        console.log(`   ℹ️  No completed bookings found`);
        skippedCount++;
        continue;
      }

      console.log(`   📦 Found ${completedBookings.length} completed bookings`);

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

      console.log(`   💰 Calculated earnings:`);
      console.log(`      Total: €${totalEarnings.toFixed(2)}`);
      console.log(`      Online: €${onlineEarnings.toFixed(2)}`);
      console.log(`      Cash: €${cashEarnings.toFixed(2)}`);
      console.log(`      Outstanding Payout: €${payoutBalance.toFixed(2)}`);

      // Check if partner was already paid
      if (partner.lastPayoutAt) {
        console.log(`   ℹ️  Partner has payout history (last: ${partner.lastPayoutAt.toISOString()})`);
        console.log(`      Checking for bookings completed after last payout...`);

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
        console.log(`      Outstanding Payout (after last payout): €${payoutBalance.toFixed(2)}`);
      }

      // Update partner
      partner.totalEarnings = totalEarnings;
      partner.onlineEarnings = onlineEarnings;
      partner.cashEarnings = cashEarnings;
      partner.payoutBalance = payoutBalance;

      await partner.save();

      console.log(`   ✅ Updated partner successfully`);
      updatedCount++;
    }

    console.log("\n" + "=".repeat(60));
    console.log("✨ Migration completed!");
    console.log(`   Updated: ${updatedCount} partners`);
    console.log(`   Skipped: ${skippedCount} partners (no completed bookings)`);
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error during migration:", error);
    process.exit(1);
  }
}

// Run the migration
recalculateAllPartnerPayouts();
