"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Shield, Users } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { DEFAULT_VEHICLE_MINIMUM_HOURS } from "@/features/fleet/lib/vehicle-form-defaults";
import type { DistanceData, FormData } from "@/features/booking/context/booking-form-context";
import type { IVehicle } from "@/features/fleet/model";
import type { useTranslations } from "next-intl";
import { VehicleArt, vehicleKindFromVehicle } from "./vehicle-art";

type TFn = ReturnType<typeof useTranslations>;

export function VehicleCard({
  vehicle,
  formData,
  distanceData,
  calculatingDistance,
  calculatedPrice,
  originalPrice,
  isSelected,
  isBestPrice,
  currencySymbol,
  handleVehicleSelect,
  t,
}: {
  vehicle: IVehicle;
  formData: FormData;
  distanceData: DistanceData | null;
  calculatingDistance: boolean;
  calculatedPrice: number;
  originalPrice: number;
  isSelected: boolean;
  isBestPrice: boolean;
  currencySymbol: string;
  handleVehicleSelect: (vehicleId: string) => void;
  t: TFn;
}) {
  const kind = vehicleKindFromVehicle(vehicle);
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!vehicle.image && !imgFailed;
  const discountValue = parseFloat(String(vehicle.discount || "0"));

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      className="veh"
      onClick={() => handleVehicleSelect(vehicle._id as string)}
    >
      <div className="art">
        {showImage ? (
          <Image
            src={vehicle.image as string}
            alt={vehicle.name}
            width={200}
            height={150}
            style={{ height: 72, width: "auto", objectFit: "cover" }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <VehicleArt kind={kind} style={{ height: 72 }} />
        )}
      </div>

      <h3>{vehicle.name}</h3>
      <span className="price num">
        {currencySymbol}
        {calculatedPrice.toFixed(2)}
      </span>
      <span className="mdl">{vehicle.description}</span>
      {isBestPrice && (
        <span className="inc" style={{ color: "var(--ink2)" }}>
          Best price
        </span>
      )}

      <div className="specs">
        <span>
          <UsersIcon />
          {vehicle.persons}
        </span>
        <span>
          <BagIcon />
          {vehicle.baggages}
        </span>
        {originalPrice > calculatedPrice && (
          <span className="line-through text-xs">
            {currencySymbol}
            {originalPrice.toFixed(2)}
          </span>
        )}
      </div>

      <div style={{ gridColumn: "1 / -1", marginTop: 10 }}>
        <Button
          onClick={() => handleVehicleSelect(vehicle._id as string)}
          className="w-full py-2 text-base font-medium"
          style={{
            background: isSelected ? "var(--sig)" : "var(--sheet)",
            color: isSelected ? "var(--sig-on)" : "var(--ink)",
            border: "1px solid var(--rule2)",
          }}
        >
          {isSelected ? t("Step2.selected") : t("Step2.select")}
        </Button>
      </div>

      {(formData.bookingType === "destination" && !distanceData) || calculatingDistance ? (
        <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--ink2)" }}>
          {calculatingDistance ? "Calculating..." : "Price unavailable"}
        </div>
      ) : null}
    </div>
  );
}

function UsersIcon() {
  return (
    <svg className="h-4 w-4" style={{ color: "var(--ink2)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg className="h-4 w-4" style={{ color: "var(--ink2)" }} fill="currentColor" viewBox="0 0 20 20">
      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
    </svg>
  );
}