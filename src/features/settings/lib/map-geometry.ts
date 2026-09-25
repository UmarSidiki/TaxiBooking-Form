import type { MapBoundsLiteral } from "@/features/settings/lib/map-bounds";

function toMapBoundsLiteral(
  bounds: google.maps.LatLngBounds
): MapBoundsLiteral {
  return {
    north: bounds.getNorthEast().lat(),
    east: bounds.getNorthEast().lng(),
    south: bounds.getSouthWest().lat(),
    west: bounds.getSouthWest().lng(),
  };
}

export function getPolygonPath(
  poly: google.maps.Polygon
): Array<{ lat: number; lng: number }> {
  const path = poly.getPath();
  const coords: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i < path.getLength(); i++) {
    const xy = path.getAt(i);
    coords.push({ lat: xy.lat(), lng: xy.lng() });
  }
  return coords;
}

export function getPolygonBounds(poly: google.maps.Polygon): MapBoundsLiteral {
  const bounds = new google.maps.LatLngBounds();
  poly.getPath().forEach((point) => bounds.extend(point));
  return toMapBoundsLiteral(bounds);
}

export function boundsToPath(bounds: MapBoundsLiteral) {
  return [
    { lat: bounds.north, lng: bounds.west },
    { lat: bounds.north, lng: bounds.east },
    { lat: bounds.south, lng: bounds.east },
    { lat: bounds.south, lng: bounds.west },
  ];
}
