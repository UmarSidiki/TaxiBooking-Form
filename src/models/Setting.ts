import { Schema, model, models } from "mongoose";

export interface ISetting {
  _id?: string;
  primaryColor: string;
  secondaryColor: string;
  borderRadius: number;
  redirectUrl?: string;
  mapInitialLat?: number;
  mapInitialLng?: number;
  mapCountryRestrictions?: string[];
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  stripeCurrency?: string;
  stripeTestMode?: boolean;
  stripeStatementDescriptor?: string;
  stripeSaveCards?: boolean;
  multisafepayApiKey?: string;
  multisafepayTestMode?: boolean;
  acceptedPaymentMethods: string[];
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIBAN?: string;
  bankSwiftBIC?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpEncryption?: 'TLS' | 'SSL' | 'none';
  smtpTestEmail?: string;
  smtpFrom?: string;
  smtpSenderName?: string;
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
    redirectUrl: {
      type: String,
      default: "", // Redirect URL after successful booking
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
    stripeWebhookSecret: {
      type: String,
      default: "",
    },
    stripeCurrency: {
      type: String,
      default: "eur",
    },
    stripeTestMode: {
      type: Boolean,
      default: true,
    },
    stripeStatementDescriptor: {
      type: String,
      default: "BOOKING", // Suffix for statement (will show as "COMPANY* BOOKING")
    },
    stripeSaveCards: {
      type: Boolean,
      default: false,
    },
    multisafepayApiKey: {
      type: String,
      default: "",
    },
    multisafepayTestMode: {
      type: Boolean,
      default: true,
    },
    acceptedPaymentMethods: {
      type: [String],
      default: ["card"], // Default to Stripe payment (includes cards, PayPal, wallets, etc.)
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
    smtpHost: {
      type: String,
      default: "",
    },
    smtpPort: {
      type: Number,
      default: 587,
    },
    smtpUser: {
      type: String,
      default: "",
    },
    smtpPass: {
      type: String,
      default: "",
    },
    smtpEncryption: {
      type: String,
      enum: ['TLS', 'SSL', 'none'],
      default: 'TLS',
    },
    smtpTestEmail: {
      type: String,
      default: "",
    },
    smtpFrom: {
      type: String,
      default: "",
    },
    smtpSenderName: {
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
