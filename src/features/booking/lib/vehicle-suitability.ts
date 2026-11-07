import type { IVehicle } from "@/features/fleet/model";

export function vehicleFitsPassengers(
  vehicle: IVehicle,
  passengers: number
): boolean {
  return (vehicle.persons ?? 0) >= passengers;
}

/** Smallest-capacity vehicle that still fits the party, cheapest to break ties. */
export function pickRecommendedVehicle(
  vehicles: IVehicle[],
  passengers: number
): IVehicle | null {
  const fitting = vehicles.filter((vehicle) =>
    vehicleFitsPassengers(vehicle, passengers)
  );
  if (fitting.length === 0) return null;

  return [...fitting].sort((a, b) => {
    const byCapacity = (a.persons ?? 0) - (b.persons ?? 0);
    return byCapacity !== 0 ? byCapacity : a.price - b.price;
  })[0];
}

/**
 * Prefer vehicles that can seat the party. When nothing fits, show the full
 * fleet rather than an empty step so the customer can still see options.
 */
export function partitionVehiclesByPassengerFit(
  vehicles: IVehicle[],
  passengers: number
): { vehicles: IVehicle[]; hasFittingVehicle: boolean } {
  const fitting = vehicles.filter((vehicle) =>
    vehicleFitsPassengers(vehicle, passengers)
  );

  return {
    vehicles: fitting.length > 0 ? fitting : vehicles,
    hasFittingVehicle: fitting.length > 0,
  };
}
