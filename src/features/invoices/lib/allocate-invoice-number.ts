import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import InvoiceCounter from "@/features/invoices/model/InvoiceCounter";

export function formatInvoiceNumber(seq: number) {
  return `INV-${String(seq).padStart(6, "0")}`;
}

/** One number per booking. A race may skip a number; it never reuses one. */
export async function allocateInvoiceNumber(bookingId: string) {
  await connectDB();
  const current = await Booking.findById(bookingId).select("invoiceNumber");
  if (!current) return null;
  if (current.invoiceNumber) return current.invoiceNumber as string;

  const counter = await InvoiceCounter.findOneAndUpdate(
    { _id: "invoice" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  const invoiceNumber = formatInvoiceNumber(counter.seq ?? 1);
  const claimed = await Booking.findOneAndUpdate(
    { _id: bookingId, invoiceNumber: { $in: [null, undefined] } },
    { $set: { invoiceNumber } },
    { new: true },
  );
  if (claimed?.invoiceNumber) return claimed.invoiceNumber as string;
  const winner = await Booking.findById(bookingId).select("invoiceNumber");
  return (winner?.invoiceNumber as string) || invoiceNumber;
}
