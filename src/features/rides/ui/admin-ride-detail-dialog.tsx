"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import type { IBooking } from "@/models/booking";
import type { AdminRideReview } from "@/hooks/rides/useAdminRides";
import type { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { AdminRideDetailAssignment } from "./admin-ride-detail-assignment";
import { AdminRideDetailBilling } from "./admin-ride-detail-billing";
import { AdminRideDetailCustomer } from "./admin-ride-detail-customer";
import { AdminRideDetailHeader } from "./admin-ride-detail-header";
import { AdminRideDetailJourney } from "./admin-ride-detail-journey";
import { AdminRideDetailReview } from "./admin-ride-detail-review";

export function AdminRideDetailDialog({
  t,
  currencySymbol,
  detailBooking,
  setDetailBooking,
  isBookingPassed,
  bookingReviews,
}: {
  t: ReturnType<typeof useTranslations>;
  currencySymbol: string;
  detailBooking: IBooking | null;
  setDetailBooking: (booking: IBooking | null) => void;
  isBookingPassed: (dateStr: string, timeStr: string) => boolean;
  bookingReviews: Record<string, AdminRideReview | null>;
}) {
  return (
    <>
      {/* Detail Dialog */}
      <Dialog
        open={Boolean(detailBooking)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailBooking(null);
          }
        }}
      >
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          {detailBooking ? (
            <div className="space-y-6">
              <AdminRideDetailHeader
                booking={detailBooking}
                t={t}
                isBookingPassed={isBookingPassed}
              />

              <div className="grid gap-6 md:grid-cols-2">
                {/* Journey Details */}
                <AdminRideDetailJourney booking={detailBooking} t={t} />

                {/* Customer Information */}
                <AdminRideDetailCustomer booking={detailBooking} t={t} />
              </div>

              {/* Special Notes */}
              {detailBooking.notes ? (
                <Card className="border border-border bg-secondary/10">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          {t("Dashboard.Rides.SpecialNotes")}
                        </p>
                        <p className="text-gray-700">{detailBooking.notes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Billing Information */}
              <AdminRideDetailBilling
                booking={detailBooking}
                t={t}
                currencySymbol={currencySymbol}
              />

              {/* Assignment Information - Show for completed rides */}
              <AdminRideDetailAssignment
                booking={detailBooking}
                isBookingPassed={isBookingPassed}
              />

              {/* Customer Review - Only show for completed rides */}
              <AdminRideDetailReview
                booking={detailBooking}
                bookingReviews={bookingReviews}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
