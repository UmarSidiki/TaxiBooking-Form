import { Partner } from "@/features/partners/model";
import { partnerMayWork } from "@/features/partners/lib/partner-access";

export type AccessMigrationRow = {
  partnerId: string;
  name: string;
  from: string;
  to: string;
  vehicles: number;
  action: "skip" | "would-write" | "wrote";
};

function nextStatus(partner: { status?: string; isActive?: boolean }) {
  if (partner.status === "approved") return partner.isActive === false ? "suspended" : "active";
  return partner.status || "pending";
}

export async function migratePartnerAccess(dryRun: boolean) {
  const partners = await Partner.find();
  const rows: AccessMigrationRow[] = [];

  for (const partner of partners) {
    const to = nextStatus(partner);
    const vehicles = new Map<string, string>();
    for (const row of partner.vehicles ?? []) {
      if (row.vehicleId) vehicles.set(String(row.vehicleId), row.status || "pending");
    }
    for (const request of partner.fleetRequests ?? []) {
      if (request.vehicleId) vehicles.set(String(request.vehicleId), request.status || "pending");
    }
    if (partner.currentFleet) vehicles.set(String(partner.currentFleet), "approved");
    if (partner.fleetStatus === "approved" && partner.requestedFleet) {
      vehicles.set(String(partner.requestedFleet), "approved");
    }
    const unchanged = partner.status === to && (partner.vehicles?.length ?? 0) === vehicles.size;
    const row = {
      partnerId: String(partner._id),
      name: partner.name,
      from: partner.status,
      to,
      vehicles: vehicles.size,
      action: unchanged ? "skip" as const : dryRun ? "would-write" as const : "wrote" as const,
    };
    if (!unchanged && !dryRun) {
      partner.status = to as typeof partner.status;
      partner.isActive = partnerMayWork({ status: to });
      partner.vehicles = [...vehicles.entries()].map(([vehicleId, status]) => ({
        vehicleId,
        status: status as "pending",
      }));
      await partner.save();
    }
    rows.push(row);
  }
  return rows;
}
