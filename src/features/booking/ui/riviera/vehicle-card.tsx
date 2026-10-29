"use client";

import { useState } from "react";
import { VehicleArt, vehicleKindFromVehicle } from "./vehicle-art";

export function VehicleCard({ vehicle, selected, onSelect }: {
  vehicle: { _id?: string; id?: string; name?: string; category?: string; price?: number; model?: string; seats?: number; bags?: number; imageUrl?: string };
  selected?: boolean;
  onSelect?: () => void;
}) {
  const kind = vehicleKindFromVehicle(vehicle);
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!vehicle.imageUrl && !imgFailed;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className="veh"
      onClick={onSelect}
    >
      <div className="art">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vehicle.imageUrl} alt={vehicle.name ?? "Vehicle"} style={{ height: 72, width: "auto" }} onError={() => setImgFailed(true)} />
        ) : (
          <VehicleArt kind={kind} style={{ height: 72 }} />
        )}
      </div>
      <h3>{vehicle.name}</h3>
      <span className="price num">{vehicle.price}</span>
      <span className="mdl">{vehicle.model}</span>
      <span className="inc">Fixed price</span>
      <div className="specs">
        <span>{vehicle.seats} pax</span>
        <span>{vehicle.bags} bags</span>
      </div>
    </button>
  );
}