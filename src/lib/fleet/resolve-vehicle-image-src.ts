import { PLACEHOLDER_VEHICLE_IMAGE } from "@/lib/fleet/vehicle-form-defaults";

export function resolveVehicleImageSrc(
  src: string,
  invalidUrlMessage = "Invalid vehicle image URL detected. Falling back to placeholder."
): string {
  if (!src) {
    return PLACEHOLDER_VEHICLE_IMAGE;
  }

  if (src.startsWith("/") || src.startsWith("data:")) {
    return src;
  }

  try {
    return new URL(src).toString();
  } catch (error) {
    console.warn(invalidUrlMessage, error);
    return PLACEHOLDER_VEHICLE_IMAGE;
  }
}
