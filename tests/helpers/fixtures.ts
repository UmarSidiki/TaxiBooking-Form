import { Booking } from "@/features/booking/model";
import { Driver } from "@/features/drivers/model";
import { Vehicle } from "@/features/fleet/model";
import { Partner } from "@/features/partners/model";
import { clearPartnerDispatchSettingsCache } from "@/features/partners/lib/get-partner-dispatch-settings";
import { Setting } from "@/features/settings/model";

export async function createVehicle() {
  return Vehicle.create({
    name: "Sedan",
    description: "Four seats",
    image: "/placeholder-car.jpg",
    persons: 4,
    baggages: 2,
    price: 10,
    pricePerKm: 2,
    pricePerHour: 30,
    minimumFare: 20,
    minimumHours: 2,
    returnPricePercentage: 100,
    category: "economy",
    isActive: true,
  });
}

export async function createPartner(input: {
  name: string;
  email: string;
  vehicleId: unknown;
  status?: "pending" | "approved" | "rejected" | "suspended";
}) {
  return Partner.create({
    name: input.name,
    email: input.email,
    password: "not-used",
    status: input.status ?? "approved",
    isActive: true,
    currentFleet: input.vehicleId,
    fleetRequests: [{ vehicleId: input.vehicleId, status: "approved" }],
  });
}

export async function createDriver(email = "driver@example.com") {
  return Driver.create({
    name: "Dee Driver",
    email,
    password: "not-used",
    isActive: true,
    status: "approved",
  });
}

export async function saveDispatchSettings(input: {
  dispatchAssigneeMode?: "exclusive" | "allow_both";
  partnerCashSettlement?: "keep_cash" | "operator_margin";
  currency?: string;
}) {
  await Setting.create({
    acceptedPaymentMethods: ["card"],
    dispatchAssigneeMode: input.dispatchAssigneeMode ?? "exclusive",
    partnerCashSettlement: input.partnerCashSettlement ?? "keep_cash",
    stripeCurrency: input.currency ?? "eur",
    enablePartners: true,
  });
  clearPartnerDispatchSettingsCache();
}

let tripSeq = 0;

export async function createRide(input: Record<string, unknown> & { selectedVehicle: unknown }) {
  tripSeq += 1;
  return Booking.create({
    tripId: `trip-${tripSeq}`,
    pickup: "Airport",
    dropoff: "Hotel",
    tripType: "oneway",
    date: "2026-12-01",
    time: "10:00",
    passengers: 2,
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "+41000000000",
    paymentMethod: "stripe",
    paymentStatus: "completed",
    status: "upcoming",
    totalAmount: 100,
    ...input,
  });
}

export function openDeadline() {
  return new Date(Date.now() + 60 * 60 * 1000);
}
