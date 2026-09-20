import type { IVehicle } from "@/models/vehicle";

export interface VehicleForm
  extends Omit<IVehicle, "_id" | "createdAt" | "updatedAt"> {
  _id?: string;
}
