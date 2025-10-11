import { Schema, model, models } from "mongoose";

export interface ISetting {
  _id?: string;
  primaryColor: string;
  secondaryColor: string;
  borderRadius: number;
  mapInitialLat?: number;
  mapInitialLng?: number;
  mapCountryRestrictions?: string[];
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  acceptedPaymentMethods: string[];
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIBAN?: string;
  bankSwiftBIC?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    primaryColor: {
      type: String,
      default: "#EAB308", // Default: yellow-500
    },
    secondaryColor: {
      type: String,
      default: "#111827", // Default: gray-900
    },
    borderRadius: {
      type: Number,
      default: 0.5, // Corresponds to Tailwind's 'lg' radius
    },
    mapInitialLat: {
      type: Number,
      default: 46.2044, // Geneva, Switzerland
    },
    mapInitialLng: {
      type: Number,
      default: 6.1432, // Geneva, Switzerland
    },
    mapCountryRestrictions: {
      type: [String],
      default: [], // No restrictions by default
    },
    stripePublishableKey: {
      type: String,
      default: "",
    },
    stripeSecretKey: {
      type: String,
      default: "",
    },
    acceptedPaymentMethods: {
      type: [String],
      default: ["card", "paypal", "apple_pay", "google_pay"], // Default payment methods
    },
    bankName: {
      type: String,
      default: "",
    },
    bankAccountName: {
      type: String,
      default: "",
    },
    bankAccountNumber: {
      type: String,
      default: "",
    },
    bankIBAN: {
      type: String,
      default: "",
    },
    bankSwiftBIC: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Setting = models.Setting || model<ISetting>("Setting", SettingSchema);

export default Setting;
