import {
  isInServiceArea,
  serviceAreaFrom,
  type ServiceAreaSettings,
} from "@/features/booking/lib/service-area";

export { isPointInPolygon } from "@/features/booking/lib/service-area";

/** True when a picked Places result lies in the configured area (polygon, else rectangle). */
export function isPlaceInServiceArea(
  place: google.maps.places.PlaceResult,
  settings: ServiceAreaSettings,
) {
  const area = serviceAreaFrom(settings);
  if (!area) return true;
  const location = place.geometry?.location;
  if (!location) return false;
  return isInServiceArea({ lat: location.lat(), lng: location.lng() }, area);
}
