"use client";

import { Plus, Trash2 } from "lucide-react";
import type { useTranslations } from "next-intl";
import type { RefObject } from "react";

import type {
  DeskBookingFormValues,
  DeskStop,
} from "@/features/desk-booking/hooks/use-desk-booking-form";
import { deskControlClassName } from "@/features/dashboard/ui/desk-toolbar";
import type { IVehicle } from "@/features/fleet/model";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

type TFn = ReturnType<typeof useTranslations>;

export function DeskBookingTripFields({
  t,
  formData,
  update,
  vehicles,
  pickupRef,
  dropoffRef,
  stopRefs,
}: {
  t: TFn;
  formData: DeskBookingFormValues;
  update: (patch: Partial<DeskBookingFormValues>) => void;
  vehicles: IVehicle[];
  pickupRef: RefObject<HTMLInputElement | null>;
  dropoffRef: RefObject<HTMLInputElement | null>;
  stopRefs: { current: Array<HTMLInputElement | null> };
}) {
  const isHourly = formData.bookingType === "hourly";

  const setStops = (stops: DeskStop[]) => update({ stops });

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground">
        {t("Dashboard.Rides.Trip")}
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desk-bookingType">{t("Step1.BookingType")}</Label>
          <Select
            value={formData.bookingType}
            onValueChange={(value) =>
              update({ bookingType: value as "destination" | "hourly" })
            }
          >
            <SelectTrigger id="desk-bookingType" className={deskControlClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="destination">
                {t("Step1.DestinationBased")}
              </SelectItem>
              <SelectItem value="hourly">{t("Step1.TimeBased")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desk-tripType">
            {t("Dashboard.Rides.trip-type")}
          </Label>
          <Select
            value={formData.tripType}
            onValueChange={(value) =>
              update({ tripType: value as "oneway" | "roundtrip" })
            }
          >
            <SelectTrigger id="desk-tripType" className={deskControlClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oneway">{t("Step1.OneWay")}</SelectItem>
              <SelectItem value="roundtrip">{t("Step1.RoundTrip")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="desk-pickup">{t("Step1.PickupLocation")}</Label>
        <Input
          id="desk-pickup"
          ref={pickupRef}
          autoComplete="off"
          value={formData.pickup}
          placeholder={t("Step1.PickupPlaceholder")}
          onChange={(event) => update({ pickup: event.target.value })}
        />
      </div>

      {!isHourly ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="desk-dropoff">{t("Step1.DropoffLocation")}</Label>
            <Input
              id="desk-dropoff"
              ref={dropoffRef}
              autoComplete="off"
              value={formData.dropoff}
              placeholder={t("Step1.DropoffPlaceholder")}
              onChange={(event) => update({ dropoff: event.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {t("Dashboard.Rides.Stops")}
              </span>
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-lg px-2.5 text-xs"
                onClick={() =>
                  setStops([
                    ...formData.stops,
                    { location: "", order: formData.stops.length },
                  ])
                }
              >
                <Plus className="size-3.5" aria-hidden="true" />
                {t("Step1.AddStop")}
              </Button>
            </div>
            {formData.stops.map((stop, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    ref={(element) => {
                      stopRefs.current[index] = element;
                    }}
                    autoComplete="off"
                    value={stop.location}
                    aria-label={`${t("Step1.stop")} ${index + 1}`}
                    onChange={(event) =>
                      setStops(
                        formData.stops.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, location: event.target.value }
                            : item
                        )
                      )
                    }
                  />
                </div>
                <Input
                  type="number"
                  min={0}
                  className="w-20"
                  value={stop.duration ?? ""}
                  aria-label={t("Step1.Duration")}
                  onChange={(event) =>
                    setStops(
                      formData.stops.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              duration: event.target.value
                                ? Number(event.target.value)
                                : undefined,
                            }
                          : item
                      )
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("Dashboard.Rides.cancel")}
                  onClick={() =>
                    setStops(formData.stops.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desk-duration">{t("Step1.Duration")}</Label>
          <Input
            id="desk-duration"
            type="number"
            min={1}
            value={formData.duration}
            onChange={(event) =>
              update({ duration: Number(event.target.value) || 0 })
            }
          />
          <p className="text-xs text-muted-foreground">
            {t("Step1.DurationDescription")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desk-date">{t("Step1.DepartureDate")}</Label>
          <Input
            id="desk-date"
            type="date"
            value={formData.date}
            onChange={(event) => update({ date: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desk-time">{t("Step1.DepartureTime")}</Label>
          <Input
            id="desk-time"
            type="time"
            value={formData.time}
            onChange={(event) => update({ time: event.target.value })}
          />
        </div>
      </div>

      {formData.tripType === "roundtrip" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="desk-returnDate">{t("Step1.ReturnDate")}</Label>
            <Input
              id="desk-returnDate"
              type="date"
              value={formData.returnDate}
              onChange={(event) => update({ returnDate: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="desk-returnTime">{t("Step1.ReturnTime")}</Label>
            <Input
              id="desk-returnTime"
              type="time"
              value={formData.returnTime}
              onChange={(event) => update({ returnTime: event.target.value })}
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desk-passengers">{t("Step1.Passengers")}</Label>
          <Input
            id="desk-passengers"
            type="number"
            min={1}
            value={formData.passengers}
            onChange={(event) =>
              update({ passengers: Number(event.target.value) || 1 })
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desk-flightNumber">
            {t("Dashboard.Rides.flight-number")}
          </Label>
          <Input
            id="desk-flightNumber"
            value={formData.flightNumber}
            onChange={(event) => update({ flightNumber: event.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="desk-vehicle">{t("Dashboard.Rides.Vehicle")}</Label>
        <Select
          value={formData.selectedVehicle}
          onValueChange={(value) => update({ selectedVehicle: value })}
        >
          <SelectTrigger id="desk-vehicle" className={deskControlClassName}>
            <SelectValue placeholder={t("Dashboard.Rides.select-vehicle")} />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle._id} value={String(vehicle._id)}>
                {vehicle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
