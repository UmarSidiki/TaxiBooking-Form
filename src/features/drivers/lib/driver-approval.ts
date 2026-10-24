import type { DriverStatus } from "@/features/drivers/model";

/** Missing status is a driver created before account approval. They already work. */
export function driverWorks(status: DriverStatus | undefined) {
  return (status ?? "approved") === "approved";
}
