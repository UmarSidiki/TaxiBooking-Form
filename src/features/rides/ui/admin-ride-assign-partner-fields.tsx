"use client";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { AdminRideCardDialogsProps } from "@/features/rides/ui/admin-ride-card-dialogs.types";
import { Users } from "lucide-react";

type Props = Pick<
  AdminRideCardDialogsProps,
  | "t"
  | "booking"
  | "currencySymbol"
  | "totalAmountValue"
  | "selectedPartner"
  | "setSelectedPartner"
  | "assignPartnerMargin"
  | "setAssignPartnerMargin"
  | "partners"
>;

export function AdminRideAssignPartnerFields({
  t,
  booking,
  currencySymbol,
  totalAmountValue,
  selectedPartner,
  setSelectedPartner,
  assignPartnerMargin,
  setAssignPartnerMargin,
  partners,
}: Props) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2 rounded-lg bg-muted/50 p-3 sm:p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("Dashboard.Rides.TripStatus")}</span>
          <span className="font-medium">#{booking.tripId}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t("Dashboard.Rides.TotalAmount")}
          </span>
          <span className="text-base font-semibold sm:text-lg">
            {currencySymbol}
            {totalAmountValue.toFixed(2)}
          </span>
        </div>
      </div>
      <div>
        <Label className="mb-2 block text-sm font-medium">
          {t("Dashboard.Rides.assign-partner")}
        </Label>
        <Select value={selectedPartner} onValueChange={setSelectedPartner}>
          <SelectTrigger className="h-11 w-full">
            <Users className="size-4 shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {partners.map((partner) => (
              <SelectItem
                key={partner._id?.toString()}
                value={partner._id?.toString() || ""}
              >
                <div className="flex flex-col">
                  <span className="text-sm">{partner.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {partner.email}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3 pt-2">
        <div>
          <Label className="text-sm font-medium">
            {t("Dashboard.Rides.margin-percentage")}
          </Label>
          <div className="mt-2 flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={assignPartnerMargin}
              onChange={(event) =>
                setAssignPartnerMargin(Number(event.target.value))
              }
              className="h-11 flex-1"
              disabled={Boolean(booking.assignedPartner)}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("Dashboard.Rides.admin-margin-amount")}
            </Label>
            <p className="mt-1 text-lg font-bold text-primary sm:text-xl">
              {currencySymbol}
              {((totalAmountValue * assignPartnerMargin) / 100).toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-accent p-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("Dashboard.Rides.partner-payout-amount")}
            </Label>
            <p className="mt-1 text-lg font-bold text-primary sm:text-xl">
              {currencySymbol}
              {(
                totalAmountValue -
                (totalAmountValue * assignPartnerMargin) / 100
              ).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
