"use client";

import { useState } from "react";
import Image from "next/image";
import { Briefcase, Users } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { DEFAULT_VEHICLE_MINIMUM_HOURS } from "@/features/fleet/lib/vehicle-form-defaults";
import type { DistanceData, FormData } from "@/features/booking/context/booking-form-context";
import type { IVehicle } from "@/features/fleet/model";
import type { useTranslations } from "next-intl";
import { VehicleArt, vehicleKindFromVehicle } from "@/shared/ui/riviera/vehicle-art";

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
      className={isSelected ? "veh is-selected" : "veh"}
      onClick={() => handleVehicleSelect(vehicle._id as string)}
    >
      <div className="art">
        {showImage ? (
          <Image
            src={vehicle.image as string}
            alt={vehicle.name}
            width={200}
            height={150}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <VehicleArt kind={kind} />
        )}
      </div>

      <div className="info">
        <h3>
          {vehicle.name}
          {isBestPrice && <span className="tag">{t("Step2.best-price")}</span>}
        </h3>
        {vehicle.description && <span className="mdl">{vehicle.description}</span>}
        <div className="specs">
          <span>
            <Users aria-hidden="true" />
            <span className="num">{vehicle.persons}</span>
          </span>
          <span>
            <Briefcase aria-hidden="true" />
            <span className="num">{vehicle.baggages}</span>
          </span>
        </div>
      </div>

      <div className="end">
        {originalPrice > calculatedPrice && (
          <s className="was num">
            {currencySymbol}
            {originalPrice.toFixed(2)}
          </s>
        )}
        <span className="price num">
          {currencySymbol}
          {calculatedPrice.toFixed(2)}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            handleVehicleSelect(vehicle._id as string);
          }}
          aria-pressed={isSelected}
          className={isSelected ? "pick is-on" : "pick"}
        >
          {isSelected ? t("Step2.selected") : t("Step2.select")}
        </Button>
      </div>

      {(formData.bookingType === "destination" && !distanceData) || calculatingDistance ? (
        <p className="note">{calculatingDistance ? t("Step1.CalculatingDistance") : t("Step2.price-unavailable")}</p>
      ) : null}
    </div>
  );
}
