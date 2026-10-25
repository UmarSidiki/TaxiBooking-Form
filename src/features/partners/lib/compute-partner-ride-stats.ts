import mongoose from "mongoose";
import { Booking } from "@/features/booking/model";

export type PartnerRideStatsResult = {
  totalRides: number;
  upcomingRides: number;
  completedRides: number;
  canceledRides: number;
  totalEarnings: number;
};

const EMPTY: PartnerRideStatsResult = {
  totalRides: 0,
  upcomingRides: 0,
  completedRides: 0,
  canceledRides: 0,
  totalEarnings: 0,
};

type StatsRow = PartnerRideStatsResult & { _id: null };

/**
 * Same rules as the previous in-memory pass, computed in one aggregation.
 * Dates are parsed as UTC, which matches the Node process on Vercel.
 */
export async function computePartnerRideStats(
  partnerId: string,
  now = new Date(),
): Promise<PartnerRideStatsResult> {
  const partnerObjectId = new mongoose.Types.ObjectId(partnerId);
  const [row] = await Booking.aggregate<StatsRow>([
    { $match: { "assignedPartner._id": partnerObjectId } },
    {
      $addFields: {
        parsedAt: {
          $dateFromString: {
            dateString: {
              $concat: [
                "$date",
                "T",
                {
                  $cond: [
                    { $in: ["$time", [null, ""]] },
                    "00:00",
                    "$time",
                  ],
                },
              ],
            },
            onError: null,
            onNull: null,
          },
        },
        partnerAmount: {
          $cond: [
            {
              $in: [
                { $type: "$partnerPayoutAmount" },
                ["double", "int", "long", "decimal"],
              ],
            },
            "$partnerPayoutAmount",
            {
              $convert: {
                input: { $ifNull: ["$totalAmount", 0] },
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
          ],
        },
      },
    },
    {
      $addFields: {
        paymentComplete: {
          $or: [
            { $eq: ["$paymentStatus", "completed"] },
            { $eq: ["$paymentMethod", "cash"] },
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalRides: { $sum: 1 },
        canceledRides: {
          $sum: { $cond: [{ $eq: ["$status", "canceled"] }, 1, 0] },
        },
        upcomingRides: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$status", "canceled"] },
                  {
                    $or: [
                      { $gt: ["$parsedAt", now] },
                      {
                        $and: [
                          { $eq: ["$parsedAt", null] },
                          { $eq: ["$status", "upcoming"] },
                        ],
                      },
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
        completedRides: {
          $sum: { $cond: [completedExpr(now), 1, 0] },
        },
        totalEarnings: {
          $sum: { $cond: [completedExpr(now), "$partnerAmount", 0] },
        },
      },
    },
  ]);

  if (!row) return EMPTY;
  return {
    totalRides: row.totalRides,
    upcomingRides: row.upcomingRides,
    completedRides: row.completedRides,
    canceledRides: row.canceledRides,
    totalEarnings: row.totalEarnings,
  };
}

function completedExpr(now: Date) {
  return {
    $or: [
      { $eq: ["$status", "completed"] },
        {
          $and: [
            { $ne: ["$status", "canceled"] },
            { $ne: ["$parsedAt", null] },
            { $lt: ["$parsedAt", now] },
            "$paymentComplete",
          ],
        },
    ],
  };
}
