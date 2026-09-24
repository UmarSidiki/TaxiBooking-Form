import type { VehicleForm } from "@/features/fleet/ui/vehicle-form.types";

export const PLACEHOLDER_VEHICLE_IMAGE = "/placeholder-car.jpg";

export const DEFAULT_VEHICLE_PERSONS = 4;
export const DEFAULT_VEHICLE_BAGGAGES = 2;
export const DEFAULT_VEHICLE_PRICE_PER_KM = 2;
export const DEFAULT_VEHICLE_PRICE_PER_HOUR = 30;
export const DEFAULT_VEHICLE_MINIMUM_FARE = 20;
export const DEFAULT_VEHICLE_MINIMUM_HOURS = 2;
export const DEFAULT_VEHICLE_RETURN_PRICE_PERCENTAGE = 100;
export const DEFAULT_CHILD_SEAT_PRICE = 10;
export const DEFAULT_BABY_SEAT_PRICE = 10;

const sharedVehicleFormDefaults = {
  name: "",
  description: "",
  persons: DEFAULT_VEHICLE_PERSONS,
  baggages: DEFAULT_VEHICLE_BAGGAGES,
  price: 0,
  pricePerKm: DEFAULT_VEHICLE_PRICE_PER_KM,
  pricePerHour: DEFAULT_VEHICLE_PRICE_PER_HOUR,
  minimumFare: DEFAULT_VEHICLE_MINIMUM_FARE,
  minimumHours: DEFAULT_VEHICLE_MINIMUM_HOURS,
  returnPricePercentage: DEFAULT_VEHICLE_RETURN_PRICE_PERCENTAGE,
  discount: 0,
  category: "economy",
  childSeatPrice: DEFAULT_CHILD_SEAT_PRICE,
  babySeatPrice: DEFAULT_BABY_SEAT_PRICE,
  stopPrice: 0,
  stopPricePerHour: 0,
  priceTiers: [] as { upToKm: number; type: "flat" | "per_km"; price: number }[],
  isActive: true,
} satisfies Omit<VehicleForm, "image">;

/** Initial empty form on first page load (image is blank). */
export const INITIAL_VEHICLE_FORM: VehicleForm = {
  ...sharedVehicleFormDefaults,
  image: "",
};

/** Reset after save/cancel/add (image uses the placeholder path). */
export const RESET_VEHICLE_FORM: VehicleForm = {
  ...sharedVehicleFormDefaults,
  image: PLACEHOLDER_VEHICLE_IMAGE,
};
