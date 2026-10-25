import mongoose, { Schema } from "mongoose";

const InvoiceCounterSchema = new Schema(
  { _id: { type: String }, seq: { type: Number, default: 0 } },
  { collection: "invoicecounters" },
);

const InvoiceCounter =
  mongoose.models.InvoiceCounter || mongoose.model("InvoiceCounter", InvoiceCounterSchema);

export default InvoiceCounter;
