import { MIN_POLYGON_POINTS } from "@/features/booking/lib/maps/map-defaults";

export function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: Array<{ lat: number; lng: number }>,
) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPlaceInServiceArea(
  place: google.maps.places.PlaceResult,
  polygonPoints?: Array<{ lat: number; lng: number }>,
) {
  if (!polygonPoints || polygonPoints.length < MIN_POLYGON_POINTS) {
    console.log("No polygon defined, allowing all locations");
    return true;
  }

  const location = place.geometry?.location;
  if (!location) {
    console.log("No location found in place");
    return false;
  }

  const point = {
    lat: location.lat(),
    lng: location.lng(),
  };

  const isInside = isPointInPolygon(point, polygonPoints);
  console.log("Point validation:", {
    address: place.formatted_address,
    point,
    isInside,
    polygonPoints: polygonPoints.length
  });

  return isInside;
}
