import { Schema, model, models } from "mongoose";

export interface ISetting {
  _id?: string;
  primaryColor: string;
  secondaryColor: string;
  borderRadius: number;
  redirectUrl?: string;
  thankYouStaySeconds?: number;
  redirectImmediatelyAfterBooking?: boolean;
  mapInitialLat?: number;
  mapInitialLng?: number;
  mapBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  mapPolygonPoints?: Array<{ lat: number; lng: number }>;
  /** ISO 3166-1 alpha-2 codes allowed to book. Empty = every country. */
  allowedBookingCountries?: string[];
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
  companyName?: string;
  companyLogoUrl?: string;
  companyAddress?: string;
  companyPhone?: string;
  /** Invoice / legal (M7) */
  legalName?: string;
  address?: string;
  taxId?: string;
  regNo?: string;
  taxRate?: number;
  taxInclusive?: boolean;
  invoiceFooter?: string;
  invoiceTerms?: string;
  enablePartners?: boolean;
  enableDrivers?: boolean;
  /** When true: customer submits appointment request; pay after operator quote. */
  enableAppointmentRequest?: boolean;
  enableEmbeddableForm?: boolean;
  enableFormBuilder?: boolean;
  /** When true: the desk can create bookings on a Customer's behalf. */
  enableDeskBooking?: boolean;
  /** When true: the promo code field shows on the booking form (if a usable code exists). */
  promoCodesEnabled?: boolean;
  enableTax?: boolean;
  taxPercentage?: number;
  taxIncluded?: boolean;
  /** Cash overflow: partner keeps cash vs operator takes margin (remittance). */
  partnerCashSettlement?: "keep_cash" | "operator_margin";
  /** Exclusive assignee vs allow driver and partner together. */
  dispatchAssigneeMode?: "exclusive" | "allow_both";
  defaultPartnerMarginPercentage?: number;
  adminEmail?: string;
  /** Persisted public site URL, detected from authenticated dashboard requests. */
  publicBaseUrl?: string;
  timezone?: string;
  whatsappTplAssigned?: boolean;
  whatsappTplAvailable?: boolean;
  whatsappTplChanged?: boolean;
  whatsappTplReminder?: boolean;
  whatsappTplSettlement?: boolean;
  cancelPolicy?: Array<{ hoursBefore: number; feePercent: number }>;
  createdAt?: Date;
  updatedAt?: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    primaryColor: {
      type: String,
      default: "#B45309",
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
    thankYouStaySeconds: {
      type: Number,
      default: 5, // Seconds to stay on Thank You page before redirect
    },
    redirectImmediatelyAfterBooking: {
      type: Boolean,
      default: false, // If true and redirectUrl set, go straight to redirectUrl after booking
    },
    mapInitialLat: {
      type: Number,
      default: 46.2044, // Geneva, Switzerland
    },
    mapInitialLng: {
      type: Number,
      default: 6.1432, // Geneva, Switzerland
    },
    mapBounds: {
      north: { type: Number },
      south: { type: Number },
      east: { type: Number },
      west: { type: Number },
    },
    mapPolygonPoints: {
      type: [{
        lat: { type: Number },
        lng: { type: Number },
      }],
      default: [],
    },
    allowedBookingCountries: {
      type: [String],
      default: [],
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
    companyName: {
      type: String,
      default: "",
    },
    companyLogoUrl: {
      type: String,
      default: "",
    },
    companyAddress: {
      type: String,
      default: "",
    },
    companyPhone: {
      type: String,
      default: "",
    },
    legalName: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    taxId: {
      type: String,
      default: "",
    },
    regNo: {
      type: String,
      default: "",
    },
    taxRate: {
      type: Number,
      default: 0,
    },
    taxInclusive: {
      type: Boolean,
      default: false,
    },
    invoiceFooter: {
      type: String,
      default: "",
    },
    invoiceTerms: {
      type: String,
      default: "",
    },
    enablePartners: {
      type: Boolean,
      default: false,
    },
    enableDrivers: {
      type: Boolean,
      default: false,
    },
    enableAppointmentRequest: {
      type: Boolean,
      default: false,
    },
    partnerCashSettlement: {
      type: String,
      enum: ["keep_cash", "operator_margin"],
      default: "keep_cash",
    },
    dispatchAssigneeMode: {
      type: String,
      enum: ["exclusive", "allow_both"],
      default: "exclusive",
    },
    defaultPartnerMarginPercentage: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    enableEmbeddableForm: {
      type: Boolean,
      default: false,
    },
    enableFormBuilder: {
      type: Boolean,
      default: false,
    },
    enableDeskBooking: {
      type: Boolean,
      default: false,
    },
    promoCodesEnabled: {
      type: Boolean,
      default: true,
    },
    enableTax: {
      type: Boolean,
      default: false,
    },
    taxPercentage: {
      type: Number,
      default: 0,
    },
    taxIncluded: {
      type: Boolean,
      default: false,
    },
    adminEmail: {
      type: String,
      default: "",
    },
    publicBaseUrl: {
      type: String,
      default: "",
    },
    timezone: {
      type: String,
      default: "Europe/Zurich",
    },
    cancelPolicy: {
      type: [
        {
          hoursBefore: { type: Number, default: 24 },
          feePercent: { type: Number, default: 0 },
        },
      ],
      default: [{ hoursBefore: 24, feePercent: 0 }],
    },
    whatsappTplAssigned: { type: Boolean, default: false },
    whatsappTplAvailable: { type: Boolean, default: false },
    whatsappTplChanged: { type: Boolean, default: false },
    whatsappTplReminder: { type: Boolean, default: false },
    whatsappTplSettlement: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    strict: false, // Allow fields not in schema (for development)
  }
);

// Force model recompilation in development
if (models.Setting) {
  delete models.Setting;
}

const Setting = model<ISetting>("Setting", SettingSchema);

export default Setting;
