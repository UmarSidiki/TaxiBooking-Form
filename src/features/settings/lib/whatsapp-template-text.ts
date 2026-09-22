import { whatsappVariables } from "@/features/settings/schema/whatsapp.schema";

export const whatsappSampleValues: Record<(typeof whatsappVariables)[number], string> = {
  name: "Amina Keller",
  tripId: "K7P2Q",
  pickup: "Geneva Airport",
  dropoff: "Rue du Rhône 48",
  date: "2026-09-23",
  time: "14:30",
  vehicle: "Mercedes V-Class",
  total: "149.00",
  passengers: "2",
  companyPhone: "+41 22 000 00 00",
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
