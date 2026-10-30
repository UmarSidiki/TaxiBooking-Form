import mongoose, { Schema, model, models } from "mongoose";

export type DriverStatus = "pending" | "approved" | "rejected";
export type DriverDocumentStatus = "pending" | "approved" | "rejected";

export interface IDriverDocument {
  _id?: string;
  type: "license" | "insurance" | "registration" | "id" | "other";
  fileName: string;
  fileData: string;
  mimeType: string;
  fileSize: number;
  status: DriverDocumentStatus;
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  expiresAt?: Date;
}

export interface IDriver {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  whatsappVerified?: boolean;
  password: string;
  isActive: boolean;
  /** Missing on drivers created before account approval. Treat as approved. */
  status?: DriverStatus;
  documents?: IDriverDocument[];
  approvedAt?: Date;
  approvedBy?: string;
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
    phone: { type: String, trim: true },
    whatsappVerified: { type: Boolean, default: false },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Don't include password in queries by default
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    documents: [
      {
        type: {
          type: String,
          enum: ["license", "insurance", "registration", "id", "other"],
          required: true,
        },
        fileName: { type: String, required: true },
        fileData: { type: String, required: true },
        mimeType: { type: String, required: true },
        fileSize: { type: Number, required: true },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        uploadedAt: { type: Date, default: Date.now },
        reviewedAt: Date,
        reviewedBy: String,
        rejectionReason: String,
        expiresAt: Date,
      },
    ],
    approvedAt: Date,
    approvedBy: String,
    assignedVehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
    },
  },
  {
    timestamps: true,
  }
);

// Dev keeps the first compiled model. Drop it once when account-approval fields are missing.
if (
  process.env.NODE_ENV !== "production" &&
  models.Driver &&
  !models.Driver.schema.path("status")
) {
  mongoose.deleteModel("Driver");
}

const Driver = models.Driver || model<IDriver>("Driver", DriverSchema);

export default Driver;