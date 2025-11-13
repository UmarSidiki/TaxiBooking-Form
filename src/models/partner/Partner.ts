import { Schema, model, models } from "mongoose";

export type PartnerStatus = "pending" | "approved" | "rejected" | "suspended";
export type DocumentStatus = "pending" | "approved" | "rejected";

export interface IPartnerDocument {
  type: "license" | "insurance" | "registration" | "id" | "other";
  fileName: string;
  fileData: string; // Base64 encoded file data
  mimeType: string; // e.g., 'image/jpeg', 'application/pdf'
  fileSize: number; // Size in bytes
  status: DocumentStatus;
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

export type FleetStatus = "none" | "pending" | "approved" | "rejected";

export interface IFleetRequest {
  vehicleId: string;
  status: FleetStatus;
  requestedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface IPartner {
  _id?: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status: PartnerStatus;
  documents: IPartnerDocument[];
  isActive: boolean;
  registeredAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  suspendedAt?: Date;
  suspendedBy?: string;
  scheduledDeletionAt?: Date;
  notes?: string;
  // Fleet assignment fields - now supports multiple requests
  fleetRequests: IFleetRequest[];
  // Keep backward compatibility - current approved fleet
  currentFleet?: string; // Vehicle ID of currently approved fleet
  // Backward compatibility fields for old fleet system
  fleetStatus?: FleetStatus;
  requestedFleet?: string;
  fleetApprovedAt?: Date;
  fleetApprovedBy?: string;
  fleetRejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PartnerDocumentSchema = new Schema<IPartnerDocument>({
  type: {
    type: String,
    enum: ["license", "insurance", "registration", "id", "other"],
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileData: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: Date,
  reviewedBy: String,
  rejectionReason: String,
});

const PartnerSchema = new Schema<IPartner>(
  {
    name: {
      type: String,
      required: [true, "Partner name is required"],
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
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    documents: [PartnerDocumentSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: Date,
    approvedBy: String,
    rejectionReason: String,
    suspendedAt: Date,
    suspendedBy: String,
    scheduledDeletionAt: Date,
    notes: String,
    // Fleet assignment fields - now supports multiple requests
    fleetRequests: [{
      vehicleId: {
        type: Schema.Types.ObjectId,
        ref: "Vehicle",
        required: true,
      },
      status: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "pending",
      },
      requestedAt: {
        type: Date,
        default: Date.now,
      },
      approvedAt: Date,
      approvedBy: String,
      rejectionReason: String,
    }],
    // Keep backward compatibility - current approved fleet
    currentFleet: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
    },
    // Backward compatibility fields for old fleet system
    fleetStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
    },
    requestedFleet: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
    },
    fleetApprovedAt: Date,
    fleetApprovedBy: String,
    fleetRejectionReason: String,
  },
  {
    timestamps: true,
  }
);

const Partner = models.Partner || model<IPartner>("Partner", PartnerSchema);

export default Partner;
