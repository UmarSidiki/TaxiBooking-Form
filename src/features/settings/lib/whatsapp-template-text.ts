import { whatsappVariables } from "@/features/settings/schema/whatsapp.schema";

export const whatsappSampleValues: Record<(typeof whatsappVariables)[number], string> = {
  name: "Amina Keller",
  tripId: "K7P2Q",
  pickup: "Geneva Airport",
  dropoff: "Rue du Rhône 48",
  date: "2026-09-23",
  time: "14:30",
  vehicle: "Mercedes V-Class",
  plate: "GE 123 456",
  driver: "Nia Driver",
  total: "149.00",
  currency: "EUR",
  passengers: "2",
  companyPhone: "+41 22 000 00 00",
  portal: "https://example.com/en/account",
  portalUrl: "https://example.com/en/account",
  statusUrl: "https://example.com/en/ride-status?token=sample",
  payUrl: "https://example.com/en/pay?token=sample",
  reviewUrl: "https://example.com/en/review?bookingId=sample",
  invoiceNumber: "INV-2026-0042",
  documents: "Driver Amina Keller — licence\nexpires 2026-10-01",
  reason: "No vehicle available",
};

const EMPTY = "—";

export function renderWhatsAppTemplate(
  body: string,
  values: Record<string, string>
) {
  return body.replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (_, key: string) => {
    const value = values[key]?.trim();
    return value ? value : EMPTY;
  });
}
