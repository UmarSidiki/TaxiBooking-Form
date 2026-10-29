"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
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

const markerIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.2)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

export function RivieraMap({ theme }: { theme?: "light" | "dark" }) {
  const tiles =
    theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer
      center={pickup}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={tiles}
      />
      <Marker position={pickup} icon={markerIcon("#1C1A16")}>
        <span>Pick-up</span>
      </Marker>
      <Marker position={dropoff} icon={markerIcon("#B8411A")}>
        <span>Drop-off</span>
      </Marker>
      <Polyline positions={[pickup, dropoff]} color="#1C1A16" weight={3} />
      <FitBounds />
    </MapContainer>
  );
}