import { spawn } from "node:child_process";
import bcrypt from "bcryptjs";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const PASSWORD = "e2e-password";
const FILE_SENTINEL = `data:application/pdf;base64,${"E2EFILEDATA".repeat(800)}`;

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri();
await mongoose.connect(uri);
const db = mongoose.connection.db;
if (!db) throw new Error("Memory database did not connect");

const password = await bcrypt.hash(PASSWORD, 10);
const vehicleId = new mongoose.Types.ObjectId();
const partnerId = new mongoose.Types.ObjectId();
const now = new Date();

await db.collection("vehicles").insertOne({
  _id: vehicleId,
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
  createdAt: now,
  updatedAt: now,
});

const businessVehicleId = new mongoose.Types.ObjectId();
await db.collection("vehicles").insertOne({
  _id: businessVehicleId,
  name: "Business",
  description: "Business class",
  image: "/placeholder-car.jpg",
  persons: 3,
  baggages: 2,
  price: 15,
  pricePerKm: 3,
  pricePerHour: 40,
  minimumFare: 20,
  minimumHours: 2,
  returnPricePercentage: 100,
  category: "business",
  isActive: true,
  createdAt: now,
  updatedAt: now,
});

const vanVehicleId = new mongoose.Types.ObjectId();
await db.collection("vehicles").insertOne({
  _id: vanVehicleId,
  name: "Van",
  description: "Van",
  image: "/placeholder-car.jpg",
  persons: 7,
  baggages: 6,
  price: 20,
  pricePerKm: 3.5,
  pricePerHour: 45,
  minimumFare: 20,
  minimumHours: 2,
  returnPricePercentage: 100,
  category: "van",
  isActive: true,
  createdAt: now,
  updatedAt: now,
});

const driverId = new mongoose.Types.ObjectId();
await db.collection("drivers").insertOne({
  _id: driverId,
  name: "Nia Driver",
  email: "driver@e2e.example",
  password,
  status: "approved",
  isActive: true,
  createdAt: now,
  updatedAt: now,
});

await db.collection("users").insertOne({
  email: "admin@e2e.example",
  password,
  name: "E2E Admin",
  role: "admin",
  isActive: true,
  createdAt: now,
  updatedAt: now,
});

await db.collection("partners").insertOne({
  _id: partnerId,
  name: "Alpine Transfers",
  email: "partner@e2e.example",
  password,
  phone: "+41000000000",
  status: "approved",
  isActive: true,
  registeredAt: now,
  currentFleet: vehicleId,
  fleetStatus: "approved",
  fleetRequests: [{ vehicleId, status: "approved", requestedAt: now }],
  documents: [
    {
      _id: new mongoose.Types.ObjectId(),
      type: "license",
      fileName: "license.pdf",
      fileData: FILE_SENTINEL,
      mimeType: "application/pdf",
      fileSize: FILE_SENTINEL.length,
      status: "approved",
      uploadedAt: now,
    },
  ],
  totalEarnings: 40,
  payoutBalance: 40,
  balance: 40,
  createdAt: now,
  updatedAt: now,
});

await db.collection("promocodes").insertOne({ code: "E2E10", kind: "percent", amount: 10, active: true, expiresAt: null, maxUses: null, maxUsesPerCustomer: null, usedCount: 0, createdAt: now, updatedAt: now });
await db.collection("settings").insertOne({
  companyName: "Lakeside Chauffeurs",
  enablePartners: true,
  enableDrivers: true,
  partnerCashSettlement: "keep_cash",
  dispatchAssigneeMode: "exclusive",
  stripeCurrency: "eur",
  timezone: "Europe/Zurich",
  acceptedPaymentMethods: ["cash", "card"],
  createdAt: now,
  updatedAt: now,
});

const pastBookingId = new mongoose.Types.ObjectId();
const todayStamp = new Date().toISOString().slice(0, 10);
await db.collection("bookings").insertMany([
  {
    tripId: "e2e-today",
    pickup: "Today Square",
    dropoff: "Old Town",
    tripType: "oneway",
    date: todayStamp,
    time: "16:00",
    passengers: 1,
    selectedVehicle: vehicleId,
    vehicleDetails: { name: "Sedan", price: "40", seats: "4" },
    childSeats: 0,
    babySeats: 0,
    notes: "",
    firstName: "Nora",
    lastName: "Keller",
    email: "nora@example.com",
    phone: "+14155552671",
    paymentMethod: "cash",
    paymentStatus: "pending",
    status: "upcoming",
    totalAmount: 40,
    createdAt: now,
    updatedAt: now,
  },
  {
    tripId: "e2e-driver",
    pickup: "Lugano Station",
    dropoff: "Paradiso",
    tripType: "oneway",
    date: "2026-12-21",
    time: "11:00",
    passengers: 2,
    selectedVehicle: vehicleId,
    vehicleDetails: { name: "Sedan", price: "60", seats: "4" },
    childSeats: 0,
    babySeats: 0,
    notes: "",
    firstName: "Mina",
    lastName: "Rossi",
    email: "mina@example.com",
    phone: "+41790000000",
    paymentMethod: "cash",
    paymentStatus: "pending",
    status: "upcoming",
    totalAmount: 60,
    driverRideStatus: "assigned",
    assignedDriver: { _id: driverId, name: "Nia Driver", email: "driver@e2e.example" },
    createdAt: now,
    updatedAt: now,
  },
  {
    tripId: "e2e-upcoming",
    pickup: "Geneva Airport",
    dropoff: "Lausanne Station",
    tripType: "oneway",
    date: "2026-12-20",
    time: "09:30",
    passengers: 2,
    selectedVehicle: vehicleId,
    vehicleDetails: { name: "Sedan", price: "80", seats: "4" },
    childSeats: 0,
    babySeats: 0,
    notes: "Meet at arrivals",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "+41000000002",
    paymentMethod: "stripe",
    paymentStatus: "completed",
    status: "upcoming",
    totalAmount: 80,
    partnerPayoutAmount: 60,
    assignedPartner: {
      _id: partnerId,
      name: "Alpine Transfers",
      email: "partner@e2e.example",
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: pastBookingId,
    tripId: "e2e-history",
    pickup: "Bern",
    dropoff: "Zurich",
    tripType: "oneway",
    date: "2024-01-15",
    time: "08:00",
    passengers: 1,
    selectedVehicle: vehicleId,
    vehicleDetails: { name: "Sedan", price: "50", seats: "4" },
    childSeats: 0,
    babySeats: 0,
    notes: "",
    firstName: "Grace",
    lastName: "Hopper",
    email: "grace@example.com",
    phone: "+41000000003",
    paymentMethod: "cash",
    paymentStatus: "completed",
    status: "completed",
    totalAmount: 50,
    partnerPayoutAmount: 40,
    assignedPartner: {
      _id: partnerId,
      name: "Alpine Transfers",
      email: "partner@e2e.example",
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    tripId: "e2e-open",
    pickup: "Sion",
    dropoff: "Martigny",
    tripType: "oneway",
    date: "2026-12-22",
    time: "14:00",
    passengers: 3,
    selectedVehicle: vehicleId,
    vehicleDetails: { name: "Sedan", price: "90", seats: "4" },
    childSeats: 0,
    babySeats: 0,
    notes: "Child seat requested",
    firstName: "Lin",
    lastName: "Chen",
    email: "lin@example.com",
    phone: "+41000000004",
    paymentMethod: "stripe",
    paymentStatus: "completed",
    status: "upcoming",
    totalAmount: 90,
    partnerPayoutAmount: 70,
    availableForPartners: true,
    partnerReviewStatus: "approved",
    partnerAcceptanceDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: now,
    updatedAt: now,
  },
]);

await db.collection("partnersettlemententries").insertOne({
  partnerId,
  bookingId: pastBookingId,
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
});

await db.collection("reviews").insertOne({
  bookingId: pastBookingId,
  tripId: "e2e-history",
  rating: 5,
  comment: "Smooth ride",
  customerName: "Grace Hopper",
  customerEmail: "grace@example.com",
  createdAt: now,
  updatedAt: now,
});

await mongoose.disconnect();

const child = spawn("npx", ["next", "dev", "-H", "127.0.0.1", "-p", "3000"], {
  stdio: "inherit",
  env: {
    ...process.env,
    MONGODB_URI: uri,
    MONGODB_DB: "test",
    NEXTAUTH_SECRET: "e2e-secret-not-for-production",
    NEXTAUTH_URL: "http://127.0.0.1:3000",
    NEXT_PUBLIC_BASE_URL: "http://127.0.0.1:3000",
    DISTANCE_MOCK: "1",
  },
});

async function shutdown() {
  child.kill("SIGTERM");
  await mongod.stop();
  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown();
});
process.on("SIGINT", () => {
  void shutdown();
});
child.on("exit", (code) => {
  void mongod.stop().finally(() => process.exit(code ?? 0));
});
