import { compare } from "bcryptjs";

import { Driver, type DriverStatus } from "@/features/drivers/model";
import { Partner, type PartnerStatus } from "@/features/partners/model";

type DeskUser = {
  id: string;
  email: string;
  name: string;
  role: "partner" | "driver";
};

export async function authorizeDeskAccount(
  email: string,
  password: string,
): Promise<DeskUser | null> {
  const partner = await Partner.findOne({ email }).select("+password");
  if (partner) return authorizePartner(partner, email, password);

  const driver = await Driver.findOne({ email }).select("+password");
  if (driver) return authorizeDriver(driver, email, password);

  return null;
}

function assertMaySignIn(status: string | undefined, isActive: boolean) {
  if (status === "pending") return;
  if (status === "rejected") throw new Error("account_rejected");
  if (status === "suspended") throw new Error("account_suspended");
  if (!isActive) throw new Error("account_turned_off");
}

async function authorizePartner(
  partner: {
    _id?: { toString(): string };
    name?: string;
    password?: string;
    status?: PartnerStatus;
    isActive?: boolean;
  },
  email: string,
  password: string,
): Promise<DeskUser> {
  assertMaySignIn(partner.status, partner.isActive !== false);
  if (!partner.password) throw new Error("Invalid email or password");
  const matches = await compare(password, partner.password);
  if (!matches) throw new Error("Invalid email or password");
  await Partner.updateOne({ _id: partner._id }, { $set: { updatedAt: new Date() } });
  return {
    id: partner._id?.toString() ?? "",
    email,
    name: partner.name || "Partner",
    role: "partner",
  };
}

async function authorizeDriver(
  driver: {
    _id?: { toString(): string };
    name?: string;
    password?: string;
    status?: DriverStatus;
    isActive?: boolean;
  },
  email: string,
  password: string,
): Promise<DeskUser> {
  assertMaySignIn(driver.status ?? "approved", driver.isActive !== false);
  if (!driver.password) throw new Error("Invalid email or password");
  const matches = await compare(password, driver.password);
  if (!matches) throw new Error("Invalid email or password");
  await Driver.updateOne({ _id: driver._id }, { $set: { updatedAt: new Date() } });
  return {
    id: driver._id?.toString() ?? "",
    email,
    name: driver.name || "Driver",
    role: "driver",
  };
}
