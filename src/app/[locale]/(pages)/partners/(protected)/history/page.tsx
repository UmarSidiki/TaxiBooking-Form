"use client";

import { PartnerHistoryCard } from "@/features/partners/ui/partner-history-card";
import { usePartnerHistory } from "@/features/partners/hooks/usePartnerHistory";
import { Button } from "@/shared/ui/button";
import { Car, Loader2 } from "lucide-react";

export default function PartnerHistoryPage() {
  const {
    t,
    loading,
    loadError,
    fetchHistory,
    historyBookings,
    bookingReviews,
    isBookingPassed,
  } = usePartnerHistory();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mb-4 size-8 animate-spin text-primary" />
        <p className="text-sm">{t("history")}…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("history")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("view-your-completed-and-canceled-rides")}
        </p>
      </div>
      {loadError ? (
        <p className="rounded-md border border-border bg-card px-4 py-3 text-sm" role="alert">
          {loadError}
          <Button variant="outline" className="ms-3 h-11" onClick={() => void fetchHistory()}>
            {t("retry")}
          </Button>
        </p>
      ) : historyBookings.length === 0 ? (
        <div className="rounded-md border border-border bg-card py-12 text-center text-muted-foreground">
          <Car className="mx-auto mb-3 size-12 opacity-50" />
          <p>{t("no-ride-history-yet")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {historyBookings.map((booking) => (
            <PartnerHistoryCard
              key={booking._id}
              booking={booking}
              t={t}
              review={bookingReviews[booking._id] ?? null}
              isPassed={isBookingPassed(booking.date, booking.time)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
