import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

const PASSWORD = "qa-password";
const mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const uri = mongod.getUri();
writeFileSync("/tmp/qa-mongo-uri.txt", uri);
await mongoose.connect(uri);
const db = mongoose.connection.db;
if (!db) throw new Error("QA database did not connect");

const password = await bcrypt.hash(PASSWORD, 10);
const now = new Date();
const sedanId = new mongoose.Types.ObjectId();
const vanId = new mongoose.Types.ObjectId();
const alpineId = new mongoose.Types.ObjectId();
const lakeId = new mongoose.Types.ObjectId();
const pendingId = new mongoose.Types.ObjectId();
const legacyId = new mongoose.Types.ObjectId();
const niaId = new mongoose.Types.ObjectId();
const omarId = new mongoose.Types.ObjectId();
const layoutId = new mongoose.Types.ObjectId();
const historyId = new mongoose.Types.ObjectId();
const clawId = new mongoose.Types.ObjectId();

function zurich(date) {
  const stamp = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return { stamp, time };
}

const today = zurich(now).stamp;
const soon = zurich(new Date(now.getTime() + 2 * 60 * 60 * 1000));
const vehicle = (id, name, perKm, ret) => ({
  _id: id,
  name,
  description: name,
  image: "/placeholder-car.jpg",
  persons: 4,
  baggages: 2,
  price: 10,
  pricePerKm: perKm,
  pricePerHour: 30,
  minimumFare: 20,
  minimumHours: 2,
  returnPricePercentage: ret,
  category: "economy",
  isActive: true,
  createdAt: now,
  updatedAt: now,
});

await db.collection("vehicles").insertMany([
  vehicle(sedanId, "Sedan", 2, 80),
  vehicle(vanId, "Van", 3, 100),
]);

await db.collection("users").insertOne({
  email: "admin@qa.example",
  password,
  name: "QA Admin",
  role: "admin",
  isActive: true,
  createdAt: now,
  updatedAt: now,
});

const partner = (id, name, email, phone, status, extra) => ({
  _id: id,
  name,
  email,
  password,
  phone,
  status,
  isActive: status !== "pending",
  registeredAt: now,
  createdAt: now,
  updatedAt: now,
  ...extra,
});

await db.collection("partners").insertMany([
  partner(alpineId, "Alpine Transfers", "partner.one@qa.example", "+14155550101", "active", {
    balance: 55,
    currentFleet: sedanId,
    fleetStatus: "approved",
    vehicles: [{ vehicleId: sedanId, status: "approved" }],
    fleetRequests: [{ vehicleId: sedanId, status: "approved", requestedAt: now }],
  }),
  partner(lakeId, "Lake Vans", "partner.two@qa.example", "+14155550102", "active", {
    balance: 0,
    currentFleet: sedanId,
    fleetStatus: "approved",
    vehicles: [
      { vehicleId: sedanId, status: "approved" },
      { vehicleId: vanId, status: "approved" },
    ],
    fleetRequests: [{ vehicleId: sedanId, status: "approved", requestedAt: now }],
  }),
  partner(pendingId, "Pending Co", "partner.pending@qa.example", "+14155550103", "pending", {
    vehicles: [],
    fleetRequests: [],
  }),
  partner(legacyId, "Legacy Coach", "legacy@qa.example", "+14155550104", "approved", {
    payoutBalance: 25,
    remittanceBalance: 10,
    currentFleet: sedanId,
    fleetStatus: "approved",
    fleetRequests: [{ vehicleId: sedanId, status: "approved", requestedAt: now }],
  }),
]);

await db.collection("drivers").insertMany([
  {
    _id: niaId,
    name: "Nia Driver",
    email: "driver.one@qa.example",
    password,
    phone: "+14155550201",
    status: "approved",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: omarId,
    name: "Omar Driver",
    email: "driver.two@qa.example",
    password,
    phone: "+14155550202",
    status: "approved",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
]);

const ride = (doc) => ({
  tripType: "oneway",
  passengers: 2,
  selectedVehicle: sedanId,
  vehicleDetails: { name: "Sedan", price: "60", seats: "4" },
  childSeats: 0,
  babySeats: 0,
  notes: "",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@qa.example",
  phone: "+14155552671",
  paymentMethod: "cash",
  paymentStatus: "pending",
  status: "upcoming",
  totalAmount: 60,
  createdAt: now,
  updatedAt: now,
  ...doc,
});

await db.collection("bookings").insertMany([
  ride({
    tripId: "qatoday1",
    pickup: "Today Square",
    dropoff: "Old Town",
    date: today,
    time: "23:30",
    partnerReviewStatus: "approved",
  }),
  ride({
    tripId: "qaovlapa",
    pickup: "Overlap North",
    dropoff: "Square",
    date: "2026-12-20",
    time: "10:00",
    assignedDriver: { _id: niaId, name: "Nia Driver", email: "driver.one@qa.example" },
  }),
  ride({
    tripId: "qaovlapb",
    pickup: "Overlap South",
    dropoff: "Harbour",
    date: "2026-12-20",
    time: "10:30",
  }),
  ride({
    tripId: "qatimeof",
    pickup: "Time Off Pier",
    dropoff: "Station",
    date: "2026-12-21",
    time: "15:00",
  }),
  ride({
    tripId: "qaclaim1",
    pickup: "Sion Market",
    dropoff: "Martigny",
    date: "2026-12-24",
    time: "13:00",
    totalAmount: 90,
    partnerPayoutAmount: 70,
    partnerMarginAmount: 20,
    paymentMethod: "stripe",
    paymentStatus: "completed",
    availableForPartners: true,
    partnerReviewStatus: "approved",
    partnerAcceptanceDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
  }),
  ride({
    tripId: "qacashm1",
    pickup: "Cash Margin Stop",
    dropoff: "Bank",
    date: "2026-12-23",
    time: "09:00",
    totalAmount: 50,
    partnerPayoutAmount: 40,
    partnerMarginAmount: 10,
    partnerMarginPercentage: 20,
    paymentMethod: "cash",
    responsibleAssignee: "partner",
    assignedPartner: { _id: alpineId, name: "Alpine Transfers", email: "partner.one@qa.example" },
  }),
  ride({
    _id: clawId,
    tripId: "qaclaw01",
    pickup: "Clawback Yard",
    dropoff: "Depot",
    date: "2026-12-28",
    time: "11:00",
    totalAmount: 20,
    partnerPayoutAmount: 15,
    partnerMarginAmount: 5,
    paymentMethod: "stripe",
    paymentStatus: "completed",
    status: "completed",
    responsibleAssignee: "partner",
    assignedPartner: { _id: alpineId, name: "Alpine Transfers", email: "partner.one@qa.example" },
  }),
  ride({
    _id: historyId,
    tripId: "qahist01",
    pickup: "Bern",
    dropoff: "Zurich",
    date: "2024-01-15",
    time: "08:00",
    totalAmount: 50,
    partnerPayoutAmount: 40,
    paymentMethod: "stripe",
    paymentStatus: "completed",
    status: "completed",
    responsibleAssignee: "partner",
    assignedPartner: { _id: alpineId, name: "Alpine Transfers", email: "partner.one@qa.example" },
  }),
  ride({
    tripId: "qaedit01",
    pickup: "Edit Lane",
    dropoff: "Cancel Court",
    date: "2026-12-26",
    time: "12:00",
    notes: "Original note",
  }),
  ride({
    tripId: "qadrvgo1",
    pickup: "Lugano Station",
    dropoff: "Paradiso",
    date: "2026-12-22",
    time: "08:00",
    paymentMethod: "cash",
    totalAmount: 42,
    driverRideStatus: "assigned",
    assignedDriver: { _id: niaId, name: "Nia Driver", email: "driver.one@qa.example" },
  }),
  ride({
    tripId: "qadrvnsh",
    pickup: "No Show Gate",
    dropoff: "Terminal",
    date: "2026-12-22",
    time: "18:00",
    driverRideStatus: "assigned",
    assignedDriver: { _id: niaId, name: "Nia Driver", email: "driver.one@qa.example" },
  }),
  ride({
    tripId: "qaremind",
    pickup: "Reminder Dock",
    dropoff: "Hotel",
    date: soon.stamp,
    time: soon.time,
    assignedDriver: { _id: niaId, name: "Nia Driver", email: "driver.one@qa.example" },
  }),
  ride({
    tripId: "qareview",
    pickup: "Review Margin",
    dropoff: "Marketplace",
    date: "2026-12-27",
    time: "15:30",
    totalAmount: 80,
    paymentMethod: "cash",
  }),
]);

await db.collection("partnersettlemententries").insertMany([
  {
    partnerId: alpineId,
    bookingId: historyId,
    type: "ride_credit",
    amount: 40,
    balanceDelta: 40,
    currency: "eur",
    channel: "online",
    fare: 50,
    margin: 10,
    partnerShare: 40,
    note: "Online ride paid and complete",
    createdAt: now,
    updatedAt: now,
  },
  {
    partnerId: alpineId,
    bookingId: clawId,
    type: "ride_credit",
    amount: 15,
    balanceDelta: 15,
    currency: "eur",
    channel: "online",
    fare: 20,
    margin: 5,
    partnerShare: 15,
    note: "Online ride paid and complete",
    createdAt: now,
    updatedAt: now,
  },
]);

const field = (type, label, placeholder, order, extra = {}) => ({
  id: type,
  type,
  label,
  placeholder,
  required: true,
  enabled: true,
  width: "full",
  order,
  step: 1,
  ...extra,
});

await db.collection("formlayouts").insertOne({
  _id: layoutId,
  name: "QA Custom",
  description: "Manual QA layout",
  isDefault: false,
  isActive: true,
  fields: [
    field("pickup", "Pickup", "Custom pickup", 1),
    field("dropoff", "Dropoff", "Custom dropoff", 2),
    field("date", "Date", "", 3),
    field("time", "Time", "", 4),
    field("passengers", "Passengers", "Passengers", 5, { required: false }),
  ],
  style: {
    backgroundColor: "#ffffff",
    backgroundOpacity: 100,
    headingText: "QA custom form",
    buttonText: "Search custom",
    buttonColor: "#0f172a",
    buttonTextColor: "#ffffff",
    showHeader: true,
    showLabels: true,
  },
  createdAt: now,
  updatedAt: now,
});

await db.collection("settings").insertOne({
  enablePartners: true,
  enableDrivers: true,
  enableAppointmentRequest: false,
  partnerCashSettlement: "operator_margin",
  dispatchAssigneeMode: "exclusive",
  defaultPartnerMarginPercentage: 20,
  stripeCurrency: "eur",
  timezone: "Europe/Zurich",
  acceptedPaymentMethods: ["cash"],
  thankYouStaySeconds: 120,
  whatsappTplAssigned: true,
  whatsappTplAvailable: true,
  whatsappTplChanged: true,
  whatsappTplReminder: true,
  whatsappTplSettlement: true,
  createdAt: now,
  updatedAt: now,
});

writeFileSync(
  "/tmp/qa-seed.json",
  JSON.stringify({ layoutId: String(layoutId), password: PASSWORD, soon }, null, 2),
);

await mongoose.disconnect();

const env = {
  ...process.env,
  MONGODB_URI: uri,
  MONGODB_DB: "test",
  NEXTAUTH_SECRET: "qa-secret-not-for-production",
  NEXTAUTH_URL: "http://127.0.0.1:3000",
  NEXT_PUBLIC_BASE_URL: "http://127.0.0.1:3000",
  QA_MOCK_WHATSAPP: "1",
  DISTANCE_MOCK: "1",
  CRON_SECRET: "qa-cron-secret",
};
delete env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const child = spawn("npx", ["next", "dev", "-H", "127.0.0.1", "-p", "3000"], {
  stdio: "inherit",
  env,
});

async function shutdown() {
  child.kill("SIGTERM");
  await mongod.stop();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
child.on("exit", (code) => {
  void mongod.stop().finally(() => process.exit(code ?? 0));
});
