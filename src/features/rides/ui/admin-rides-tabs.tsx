"use client";

import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { useAdminRides } from "@/features/rides/hooks/useAdminRides";
import { AdminRideCardList } from "@/features/rides/ui/admin-ride-card-list";
import { AdminRidesTabPanel } from "@/features/rides/ui/admin-rides-tab-panel";
import { Ban, CalendarDays, CheckCircle, Clock, Inbox } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type Rides = ReturnType<typeof useAdminRides>;

export function AdminRidesTabs({ rides }: { rides: Rides }) {
  const { t, activeTab, filteredBookings, enableAppointmentRequest } = rides;
  const count = filteredBookings.length;
  const cols = enableAppointmentRequest ? "grid-cols-5" : "grid-cols-3";

  return (
    <Tabs
      value={activeTab}
      onValueChange={rides.setActiveTab}
      className="flex w-full flex-col gap-4"
    >
      <TabsList
        className={cn(
          "grid h-auto w-full gap-1 rounded-xl border border-border/60 bg-muted/40 p-1",
          cols
        )}
      >
        {enableAppointmentRequest ? (
          <>
            <RideTab
              value="requests"
              icon={Inbox}
              label={t("Dashboard.Rides.Requests")}
              count={activeTab === "requests" ? count : 0}
            />
            <RideTab
              value="awaiting_payment"
              icon={Clock}
              label={t("Dashboard.Rides.status-awaiting-payment")}
              count={activeTab === "awaiting_payment" ? count : 0}
            />
          </>
        ) : null}
        <RideTab
          value="upcoming"
          icon={CalendarDays}
          label={t("Dashboard.Rides.UpcomingRides")}
          count={activeTab === "upcoming" ? count : 0}
        />
        <RideTab
          value="passed"
          icon={CheckCircle}
          label={t("Dashboard.Rides.CompletedRides")}
          count={activeTab === "passed" ? count : 0}
        />
        <RideTab
          value="canceled"
          icon={Ban}
          label={t("Dashboard.Rides.CanceledRides")}
          count={activeTab === "canceled" ? count : 0}
        />
      </TabsList>

      {enableAppointmentRequest ? (
        <>
          <RidePanel
            rides={rides}
            value="requests"
            icon={Inbox}
            title={t("Dashboard.Rides.NoRequests")}
            description={t("Dashboard.Rides.NoRequestsDescription")}
          />
          <RidePanel
            rides={rides}
            value="awaiting_payment"
            icon={Clock}
            title={t("Dashboard.Rides.NoAwaitingPayment")}
            description={t("Dashboard.Rides.NoAwaitingPaymentDescription")}
          />
        </>
      ) : null}
      <RidePanel
        rides={rides}
        value="upcoming"
        icon={CalendarDays}
        title={t("Dashboard.Rides.NoUpcomingRides")}
        description={t("Dashboard.Rides.NoUpcomingRidesDescription")}
      />
      <RidePanel
        rides={rides}
        value="passed"
        icon={CheckCircle}
        title={t("Dashboard.Rides.NoCompletedRides")}
        description={t("Dashboard.Rides.NoCompletedRidesDescription")}
      />
      <RidePanel
        rides={rides}
        value="canceled"
        icon={Ban}
        title={t("Dashboard.Rides.NoCanceledRides")}
        description={t("Dashboard.Rides.NoCanceledRidesDescription")}
      />
    </Tabs>
  );
}

function RideTab({
  value,
  icon: Icon,
  label,
  count,
}: {
  value: string;
  icon: typeof CalendarDays;
  label: string;
  count: number;
}) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "min-h-11 min-w-0 gap-1.5 rounded-lg px-2 py-2 text-xs text-muted-foreground transition-colors duration-200 sm:text-sm",
        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate font-medium">{label}</span>
      {count > 0 ? (
        <Badge
          variant="secondary"
          className="hidden px-1.5 tabular-nums sm:inline-flex"
        >
          {count}
        </Badge>
      ) : null}
    </TabsTrigger>
  );
}

function RidePanel({
  rides,
  value,
  icon,
  title,
  description,
}: {
  rides: Rides;
  value: string;
  icon: typeof CalendarDays;
  title: string;
  description: string;
}) {
  return (
    <AdminRidesTabPanel
      value={value}
      isLoading={rides.isLoading}
      isEmpty={rides.filteredBookings.length === 0}
      fetchBookings={rides.fetchBookings}
      t={rides.t}
      emptyIcon={icon}
      emptyTitle={title}
      emptyDescription={description}
      gridClassName="flex flex-col gap-3"
    >
      <AdminRideCardList rides={rides} />
    </AdminRidesTabPanel>
  );
}
