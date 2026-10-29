import { describe, expect, it } from "vitest";
import { clearWhatsAppOutbox, readWhatsAppOutbox } from "@/features/settings/lib/whatsapp-outbox";
import { WhatsAppConfig, WhatsAppTemplate } from "@/features/settings/model";
import { sendCustomerRideUpdate } from "@/features/customers/lib/send-customer-ride-update";
import { Vehicle } from "@/features/fleet/model";
import { createRide, createVehicle } from "./helpers/fixtures";

describe("customer ride WhatsApp", () => {
  it("stays quiet until that message is enabled, then includes driver, car, and plate", async () => {
    process.env.QA_MOCK_WHATSAPP = "1";
    process.env.NEXTAUTH_SECRET = "test-secret";
    process.env.NEXT_PUBLIC_BASE_URL = "http://127.0.0.1:3000";
    clearWhatsAppOutbox();
    const vehicle = await createVehicle();
    await Vehicle.updateOne({ _id: vehicle._id }, { plate: "GE 123" });
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      whatsappOptIn: true,
      phone: "+14155552671",
      assignedDriver: { name: "Nia Driver" },
    });
    await WhatsAppConfig.create({ enabled: true, defaultCallingCode: "1", notifyNumbers: [], companyPhone: "", defaultLocale: "en" });
    expect((await sendCustomerRideUpdate(String(ride._id), "driver_assigned")).sent).toBe(0);
    await WhatsAppTemplate.create({
      event: "driver_assigned",
      audience: "customer",
      locale: "en",
      enabled: true,
      body: "{{driver}} in {{vehicle}} {{plate}}. {{statusUrl}}",
    });
    const sent = await sendCustomerRideUpdate(String(ride._id), "driver_assigned");
    expect(sent.sent).toBe(1);
    const text = readWhatsAppOutbox().at(-1)?.text ?? "";
    expect(text).toContain("Nia Driver");
    expect(text).toContain("GE 123");
    expect(text).toContain("/ride-status?token=");
  });
});
