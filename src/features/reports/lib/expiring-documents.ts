import { Driver } from "@/features/drivers/model";
import { Vehicle } from "@/features/fleet/model";
import { notify } from "@/features/notifications/notify";

export async function expiringDocuments(now = new Date()) {
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [drivers, vehicles] = await Promise.all([
    Driver.find({ "documents.expiresAt": { $lte: soon } }).select("name documents.expiresAt documents.type").limit(50).lean(),
    Vehicle.find({ insuranceExpiresAt: { $lte: soon } }).select("name insuranceExpiresAt").limit(50).lean(),
  ]);
  return { drivers, vehicles };
}

export async function alertExpiringDocuments(now = new Date()) {
  const { drivers, vehicles } = await expiringDocuments(now);
  if (!drivers.length && !vehicles.length) return { success: true, sent: 0 };
  const documents = [
    ...drivers.map((driver) => `Driver ${driver.name}`),
    ...vehicles.map((vehicle) => `Vehicle ${vehicle.name}`),
  ].join("\n");

  const result = await notify("document_expiry", { variables: { documents } });
  return { success: result.ok, sent: result.queued };
}
