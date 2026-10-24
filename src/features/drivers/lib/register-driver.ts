import { hash } from "bcryptjs";

import { User } from "@/features/auth/model";
import { Driver } from "@/features/drivers/model";
import { Partner } from "@/features/partners/model";
import { Setting } from "@/features/settings/model";
import { connectDB } from "@/shared/db";
import { sanitizeInput } from "@/shared/lib/validation";

export type DriverRegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type DriverRegisterFailure = "module-off" | "conflict";

export async function registerDriver(
  input: DriverRegisterInput,
): Promise<{ ok: true } | { ok: false; reason: DriverRegisterFailure }> {
  await connectDB();
  const settings = await Setting.findOne().select("enableDrivers");
  if (settings && settings.enableDrivers === false) {
    return { ok: false, reason: "module-off" };
  }

  const email = input.email.toLowerCase().trim();
  const [driver, partner, admin] = await Promise.all([
    Driver.exists({ email }),
    Partner.exists({ email }),
    User.exists({ email }),
  ]);
  if (driver || partner || admin) return { ok: false, reason: "conflict" };

  try {
    await Driver.create({
      name: sanitizeInput(input.name.trim()),
      email,
      password: await hash(input.password, 12),
      status: "pending",
      isActive: false,
      documents: [],
    });
  } catch (error) {
    if (isDuplicateEmail(error)) return { ok: false, reason: "conflict" };
    throw error;
  }

  return { ok: true };
}

function isDuplicateEmail(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}
