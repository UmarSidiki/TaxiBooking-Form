import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { allocateInvoiceNumber } from "@/features/invoices/lib/allocate-invoice-number";
import { buildInvoicePdf } from "@/features/invoices/lib/build-invoice-pdf";
import { invoiceCopy, invoiceLineLabel } from "@/features/invoices/lib/invoice-labels";
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
    const built = await buildInvoicePdf(ride.tripId);
    expect(built?.pdf.subarray(0, 4).toString()).toBe("%PDF");
    mkdirSync("/opt/cursor/artifacts/qa", { recursive: true });
    writeFileSync("/opt/cursor/artifacts/qa/m8-invoice-sample.pdf", built!.pdf);
    expect(invoiceCopy("ar").invoice).toBe("فاتورة");
    expect(invoiceLineLabel("night", "de")).toBe("Nachtzuschlag");
    expect(invoiceCopy("zz").invoice).toBe("Invoice");
  });
});
