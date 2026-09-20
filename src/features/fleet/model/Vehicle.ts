import { Schema, model, models } from "mongoose";

export interface IVehicle {
  _id?: string;
  name: string;
  description: string;
  image: string;
  persons: number;
  baggages: number;
  price: number;
  pricePerKm: number;
  pricePerHour: number;
  minimumFare: number;
  minimumHours: number;
  returnPricePercentage: number;
  discount: number;
  category: string;
  childSeatPrice: number;
  babySeatPrice: number;
  stopPrice: number;
  stopPricePerHour: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    name: {
      type: String,
      required: [true, "Vehicle name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
      default: "/placeholder-car.jpg",
    },
    persons: {
      type: Number,
      required: [true, "Number of persons is required"],
      min: [1, "Minimum 1 person capacity"],
      max: [50, "Maximum 50 persons capacity"],
    },
    baggages: {
      type: Number,
      required: [true, "Number of baggages is required"],
      min: [0, "Minimum 0 baggages"],
      max: [20, "Maximum 20 baggages"],
    },
    price: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Price must be positive"],
    },
    pricePerKm: {
      type: Number,
      required: [true, "Price per km is required"],
      min: [0, "Price per km must be positive"],
      default: 2,
    },
    pricePerHour: {
      type: Number,
      required: [true, "Price per hour is required"],
      min: [0, "Price per hour must be positive"],
      default: 30,
    },
    minimumFare: {
      type: Number,
      required: [true, "Minimum fare is required"],
      min: [0, "Minimum fare must be a positive number"],
      default: 20,
    },
    minimumHours: {
      type: Number,
      required: [true, "Minimum hours is required"],
      min: [1, "Minimum hours must be at least 1"],
      default: 2,
    },
    returnPricePercentage: {
      type: Number,
      required: [true, "Return price percentage is required"],
      min: [0, "Return price percentage cannot be negative"],
      default: 100, // 100% means double the price for a return trip
    },
    discount: {
      type: Number,
      required: false,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
      default: 0, // 0% means no discount
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["economy", "comfort", "business", "van", "luxury", "suv"],
      default: "economy",
    },
    childSeatPrice: {
      type: Number,
      required: false,
      min: [0, "Child seat price must be positive"],
      default: 10,
    },
    babySeatPrice: {
      type: Number,
      required: false,
      min: [0, "Baby seat price must be positive"],
      default: 10,
    },
    stopPrice: {
      type: Number,
      required: false,
      min: [0, "Stop price must be positive"],
      default: 0,
    },
    stopPricePerHour: {
      type: Number,
      required: false,
      min: [0, "Stop price per hour must be positive"],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const Vehicle = models.Vehicle || model<IVehicle>("Vehicle", VehicleSchema);

export default Vehicle;
