import type { IVehicle } from "@/features/fleet/model";

export interface VehicleForm
  extends Omit<IVehicle, "_id" | "createdAt" | "updatedAt"> {
  _id?: string;
}
