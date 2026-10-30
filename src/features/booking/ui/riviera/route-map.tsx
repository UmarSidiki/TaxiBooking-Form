"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, AttributionControl } from "react-leaflet";
import L from "leaflet";
import { fetchOsrmRoute } from "@/features/booking/lib/maps/osrm-route";

const pickup: [number, number] = [46.2381, 6.109];
const dropoff: [number, number] = [46.2, 6.15];

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, positions]);
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
  const tiles = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const [positions, setPositions] = useState<[number, number][]>([pickup, dropoff]);

  useEffect(() => {
    let active = true;
    fetchOsrmRoute(pickup, dropoff).then((route) => {
      if (active && route && route.length > 1) setPositions(route);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <MapContainer
      center={pickup}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer attribution={process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION || "© OpenStreetMap contributors"} url={tiles} />
      <AttributionControl prefix={false} />
      <Marker position={pickup} icon={pickupIcon} interactive={false} keyboard={false}>
        <span>Pick-up</span>
      </Marker>
      <Marker position={dropoff} icon={dropoffIcon} interactive={false} keyboard={false}>
        <span>Drop-off</span>
      </Marker>
      <Polyline positions={positions} color="var(--sheet)" weight={8} />
      <Polyline positions={positions} color="var(--ink)" weight={4} />
      <FitBounds positions={positions} />
    </MapContainer>
  );
}