import { mkdirSync, writeFileSync } from "node:fs";
import { renderInvoicePdf } from "@/features/booking/lib/render-invoice-pdf";

const booking = {
  tripId: "trip-sample",
  locale: "en",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+41 00 000 00 00",
  company: "Acme SA",
  vatId: "CHE-123.456.789",
  pickup: "Geneva Airport",
  dropoff: "Hotel Beau-Rivage",
  stops: [{ location: "Gare Cornavin" }],
  bookingType: "destination",
  tripType: "roundtrip",
  duration: 2,
  date: "2026-12-01",
  time: "10:00",
  returnDate: "2026-12-03",
  returnTime: "12:00",
  passengers: 2,
  flightNumber: "LX 2814",
  childSeats: 1,
  babySeats: 0,
  meetAndGreet: true,
  vehicleDetails: { name: "Mercedes E-Class" },
  totalAmount: 112.4,
  subtotalAmount: 102.18,
  taxAmount: 10.22,
  taxPercentage: 10,
  paymentStatus: "completed",
  paymentMethod: "stripe",
  fareLines: [
    { code: "vehicle", amount: 90 },
    { code: "stops", amount: 10 },
    { code: "meet_greet", amount: 12.18 },
    { code: "promo", amount: -10 },
  ],
  depositDue: 0,
  balanceDue: 0,
};

const pdf = await renderInvoicePdf(booking as never, "CHF", "Acme Transfers", {
  invoiceNumber: "INV-000001",
  brandColor: "#B45309",
  legalName: "Acme Transfers SA",
  address: "Rue du Lac 1, 1200 Genève",
  taxId: "CHE-123.456.789",
  regNo: "CH-123-456",
  taxRate: 10,
  taxInclusive: false,
  invoiceFooter: "Thank you for choosing us.",
  invoiceTerms: "Payment due on receipt.",
  bankName: "UBS",
  bankAccountName: "Acme Transfers SA",
  bankIBAN: "CH93 0000 0000 0000 0000 0",
  bankSwiftBIC: "UBSWCHZH80A",
  companyName: "Acme Transfers",
  companyPhone: "+41 22 000 00 00",
  logoDataUrl: undefined,
});

mkdirSync("/workspace/shots", { recursive: true });
writeFileSync("/workspace/shots/invoice-sample.pdf", Buffer.from(pdf));
console.log("wrote /workspace/shots/invoice-sample.pdf", pdf.length);
