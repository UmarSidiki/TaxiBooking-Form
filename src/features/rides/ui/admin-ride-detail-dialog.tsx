"use client";

import {
  Dialog,
  DialogContent,
} from "@/shared/ui/dialog";
import type { IBooking } from "@/features/booking/model";
import type { AdminRideReview } from "@/features/rides/hooks/useAdminRides";
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
              <AdminRideDetailHeader booking={detailBooking} t={t} />

              <div className="grid gap-6 md:grid-cols-2">
                {/* Journey Details */}
                <AdminRideDetailJourney booking={detailBooking} t={t} />

                {/* Customer Information */}
                <AdminRideDetailCustomer booking={detailBooking} t={t} />
              </div>

              {/* Special Notes */}
              {detailBooking.notes ? (
                <div className="rounded-md border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground mb-1">
                          {t("Dashboard.Rides.SpecialNotes")}
                        </p>
                        <p className="text-foreground">{detailBooking.notes}</p>
                      </div>
                    </div>
                </div>
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
                t={t}
                isBookingPassed={isBookingPassed}
              />

              <AdminRideDetailReview
                booking={detailBooking}
                t={t}
                bookingReviews={bookingReviews}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
