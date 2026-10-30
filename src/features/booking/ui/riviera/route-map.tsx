"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, AttributionControl } from "react-leaflet";
import L from "leaflet";

const pickup: [number, number] = [46.2381, 6.109];
const dropoff: [number, number] = [46.2, 6.15];

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([pickup, dropoff]);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map]);
  return null;
}

const pickupIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:var(--sheet);border:3px solid var(--ink);box-shadow:0 0 0 1px var(--rule2)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const dropoffIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:3px;background:var(--sig);border:2px solid var(--sheet);box-shadow:0 0 0 1px var(--rule2)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export function RivieraMap({ theme }: { theme?: "light" | "dark" }) {
  const tiles = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <MapContainer
      center={pickup}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url={tiles} />
      <AttributionControl prefix={false} />
      <Marker position={pickup} icon={pickupIcon} interactive={false} keyboard={false}>
        <span>Pick-up</span>
      </Marker>
      <Marker position={dropoff} icon={dropoffIcon} interactive={false} keyboard={false}>
        <span>Drop-off</span>
      </Marker>
      <Polyline positions={[pickup, dropoff]} color="var(--sheet)" weight={8} />
      <Polyline positions={[pickup, dropoff]} color="var(--ink)" weight={4} />
      <FitBounds />
    </MapContainer>
  );
}