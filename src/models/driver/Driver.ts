import { Schema, model, models } from "mongoose";

export interface IDriver {
  _id?: string;
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  assignedVehicle?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    name: {
      type: String,
      required: [true, "Driver name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Don't include password in queries by default
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    assignedVehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const Driver = models.Driver || model<IDriver>("Driver", DriverSchema);

export default Driver;