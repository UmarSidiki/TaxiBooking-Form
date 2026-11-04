import { configureE2eDatabase } from "./login-token";

/** Gives an existing customer a verified WhatsApp number in the e2e database. */
export async function seedVerifiedPhone(email: string, verifiedPhone: string) {
  configureE2eDatabase();
  const { connectDB } = await import("../../src/shared/db");
  const mongoose = await connectDB();
  await mongoose.connection.collection("customerprofiles").updateOne(
    { email },
    { $set: { email, verifiedPhone } },
    { upsert: true },
  );
}
