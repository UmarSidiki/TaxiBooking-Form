import { boundsToPath } from "@/features/settings/lib/map-geometry";
import type { MapBoundsLiteral } from "@/features/settings/lib/map-bounds";

export const DESK_MAP_POLYGON = {
  editable: true,
  draggable: false,
  strokeColor: "#6B5428",
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: "#6B5428",
  fillOpacity: 0.2,
};

export function attachPolygonListeners(
  poly: google.maps.Polygon,
  onChange: (poly: google.maps.Polygon) => void
) {
  const path = poly.getPath();
  google.maps.event.addListener(path, "set_at", () => onChange(poly));
  google.maps.event.addListener(path, "insert_at", () => onChange(poly));
  google.maps.event.addListener(path, "remove_at", () => onChange(poly));
  poly.addListener("dragend", () => onChange(poly));
}

export function createDeskPolygon(
  map: google.maps.Map,
  paths: Array<{ lat: number; lng: number }>
) {
  return new google.maps.Polygon({
    map,
    paths,
    ...DESK_MAP_POLYGON,
  });
}

export function polygonFromBounds(
  map: google.maps.Map,
  bounds: MapBoundsLiteral
) {
  return createDeskPolygon(map, boundsToPath(bounds));
}
