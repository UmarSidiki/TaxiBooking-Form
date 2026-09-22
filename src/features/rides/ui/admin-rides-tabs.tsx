"use client";

import { Ban, CalendarDays, CheckCircle } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { useAdminRides } from "@/features/rides/hooks/useAdminRides";
import { AdminRideCardList } from "@/features/rides/ui/admin-ride-card-list";
import { AdminRidesTabPanel } from "@/features/rides/ui/admin-rides-tab-panel";

type Rides = ReturnType<typeof useAdminRides>;

const triggerClass =
  "min-h-11 min-w-0 gap-1.5 rounded-md px-2 py-2 text-xs transition-colors duration-200 sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground";

export function AdminRidesTabs({ rides }: { rides: Rides }) {
  const { t, activeTab, filteredBookings, isLoading, fetchBookings } = rides;
  const count = filteredBookings.length;

  return (
    <Tabs value={activeTab} onValueChange={rides.setActiveTab} className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-md border border-border bg-muted p-1">
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
    <TabsTrigger value={value} className={triggerClass}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate font-medium">{label}</span>
      {count > 0 ? (
        <Badge variant="outline" className="hidden px-1.5 tabular-nums sm:inline-flex">
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
    >
      <AdminRideCardList rides={rides} />
    </AdminRidesTabPanel>
  );
}
