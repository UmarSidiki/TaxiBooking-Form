import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { allocateInvoiceNumber } from "@/features/invoices/lib/allocate-invoice-number";
import { buildInvoicePdf } from "@/features/invoices/lib/build-invoice-pdf";
import { sendInvoiceNotice } from "@/features/invoices/lib/send-invoice-notice";
import { invoiceCopy, invoiceLineLabel } from "@/features/invoices/lib/invoice-labels";
import { startRideCheckout } from "@/features/invoices/lib/start-ride-checkout";
import { clearQaMail, readQaMail } from "@/features/settings/lib/email-outbox";
import { clearWhatsAppOutbox, readWhatsAppOutbox } from "@/features/settings/lib/whatsapp-outbox";
import { createRide, createVehicle } from "./helpers/fixtures";

describe("invoices", () => {
  it("keeps one sequential number and renders a localized PDF", async () => {
    const vehicle = await createVehicle();
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      locale: "ar",
      fareLines: [
        { code: "vehicle", amount: 40 },
        { code: "promo", amount: -4 },
      ],
      paymentStatus: "pending",
    });
    const first = await allocateInvoiceNumber(String(ride._id));
    const second = await allocateInvoiceNumber(String(ride._id));
    expect(first).toBe(second);
    expect(first).toMatch(/^INV-\d{6}$/);
    const next = await createRide({ selectedVehicle: vehicle._id });
    const other = await allocateInvoiceNumber(String(next._id));
    expect(other).not.toBe(first);
    process.env.NEXTAUTH_SECRET = "qa-secret-not-for-production";
    process.env.NEXTAUTH_URL = "http://127.0.0.1:3000";
    process.env.NEXT_PUBLIC_BASE_URL = "http://127.0.0.1:3000";
    const built = await buildInvoicePdf(ride.tripId);
    expect(built?.pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(built!.pdf.length).toBeGreaterThan(20_000);
    expect(built?.payUrl).toContain("/pay/ride/");
    mkdirSync("/opt/cursor/artifacts/qa", { recursive: true });
    writeFileSync("/opt/cursor/artifacts/qa/m8-invoice-sample.pdf", built!.pdf);
    expect(invoiceCopy("ar").invoice).toBe("فاتورة");
    expect(invoiceLineLabel("night", "de")).toBe("Nachtzuschlag");
    expect(invoiceCopy("zz").invoice).toBe("Invoice");
    expect(invoiceCopy("ar").dueNow).toBe("المستحق الآن");
  });

  it("emails the PDF and sends it as a WhatsApp document", async () => {
    process.env.QA_MOCK_EMAIL = "1";
    process.env.QA_MOCK_WHATSAPP = "1";
    process.env.NEXTAUTH_SECRET = "qa-secret-not-for-production";
    process.env.NEXTAUTH_URL = "http://127.0.0.1:3000";
    clearQaMail();
    clearWhatsAppOutbox();
    const vehicle = await createVehicle();
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      totalAmount: 80,
      depositDue: 20,
      balanceDue: 60,
      paymentStatus: "pending",
      fareLines: [{ code: "vehicle", amount: 80 }],
    });
    const preview = await buildInvoicePdf(ride.tripId);
    writeFileSync("/opt/cursor/artifacts/qa/m8-invoice-en.pdf", preview!.pdf);
    const sent = await sendInvoiceNotice(ride.tripId, true);
    expect(sent.ok && sent.emailed).toBe(true);
    const mail = readQaMail().at(-1);
    const file = Array.isArray(mail?.attachments) ? mail.attachments[0] : undefined;
    const bytes = file && "content" in file && Buffer.isBuffer(file.content) ? file.content : Buffer.from([]);
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
    const document = readWhatsAppOutbox().at(-1)?.document;
    expect(Buffer.from(document?.base64 || "", "base64").subarray(0, 4).toString()).toBe("%PDF");
    delete process.env.QA_MOCK_EMAIL;
    delete process.env.QA_MOCK_WHATSAPP;
  });

  it("opens a cash pay page or a Stripe checkout for the amount due", async () => {
    process.env.NEXTAUTH_SECRET = "qa-secret-not-for-production";
    const vehicle = await createVehicle();
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      totalAmount: 80,
      depositDue: 20,
      balanceDue: 60,
      paymentStatus: "pending",
    });
    const cash = await startRideCheckout(ride.tripId, new Request("http://127.0.0.1/pay"), null);
    expect(cash.ok && cash.state).toBe("cash");
    if (cash.ok && cash.state === "cash") expect(cash.summary.amountDue).toBe(20);
    let charged = 0;
    const stripe = {
      paymentIntents: {
        create: async (params: { amount: number }) => {
          charged = params.amount;
          return { id: "pi_test", client_secret: "sec_test" };
        },
        retrieve: async () => ({ client_secret: "sec_test", status: "requires_payment_method" }),
      },
    };
    const card = await startRideCheckout(ride.tripId, new Request("http://127.0.0.1/pay"), stripe);
    expect(card.ok && card.state).toBe("stripe");
    expect(charged).toBe(2000);
  });
});
