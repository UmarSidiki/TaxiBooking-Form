import { Schema, model, models } from "mongoose";

/**
 * Booking-specific field types that map directly to the booking form.
 *
 * Step 1 — Trip Details:
 *   booking-type, pickup, dropoff, stops, trip-type, date, time,
 *   return-date, return-time, passengers, duration
 */
export const BOOKING_FIELD_TYPES = [
  "booking-type",
  "pickup",
  "dropoff",
  "stops",
  "trip-type",
  "date",
  "time",
  "return-date",
  "return-time",
  "passengers",
  "duration",
] as const;

export type BookingFieldType = (typeof BOOKING_FIELD_TYPES)[number];

export interface IFormField {
  id: string;
  type: BookingFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  enabled: boolean;
  width: "full" | "half" | "third" | "quarter" | "two-thirds";
  /** Override width when booking type is hourly */
  widthWhenHourly?: "full" | "half" | "third" | "quarter" | "two-thirds";
  /** Override width for mobile view (screens < 640px) */
  mobileWidth?: "full" | "half" | "third" | "quarter" | "two-thirds";
  /** Override width for mobile view when booking type is hourly */
  mobileWidthWhenHourly?: "full" | "half" | "third" | "quarter" | "two-thirds";
  order: number;
  /** Which step this field belongs to (1 = trip details) */
  step: 1;
  /** Conditional visibility rules */
  visibleWhen?: {
    /** Only show when booking type equals this value */
    bookingType?: "destination" | "hourly";
    /** Only show when trip type equals this value */
    tripType?: "roundtrip";
  };
  /** Show border/container for button-type fields (booking-type, trip-type) */
  showBorder?: boolean;
}

export interface IFormStyle {
  // Container & Background
  backgroundColor: string;
  backgroundOpacity: number; // 0-100
  glassEffect: boolean;
  borderRadius: string;
  borderColor: string;
  borderWidth: string;
  
  // Typography
  primaryColor: string; // Used for "Step 1", Icons, Active states
  headingColor: string;
  labelColor: string;
  textColor: string;
  fontFamily?: string;

  // Header & Footer
  showHeader: boolean;
  headingText: string;
  subHeadingText?: string;
  headingAlignment: "left" | "center" | "right";
  subHeadingAlignment?: "left" | "center" | "right";
  showFooter: boolean;
  footerText: string;
  footerTextAlignment?: "left" | "center" | "right";
  showSteps: boolean;
  showFooterImages: boolean;
  columns?: number; // 1, 2, 3, 4 (default 2)

  // Submit Button
  buttonText: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonSize?: "small" | "default" | "large";
  buttonWidth: "full" | "two-thirds" | "half" | "third" | "quarter";
  buttonAlignment: "left" | "center" | "right";
  buttonBorderRadius?: string;
  buttonPosition?: number; // Index position of button among fields (null/undefined = at end)

  // Components
  inputBackgroundColor: string;
  inputBorderColor: string;
  inputTextColor: string;
  bookingTypeButtonColor?: string;
  bookingTypeButtonTextColor?: string;

  // Layout & Polish
  showLabels?: boolean;
  inputSize?: "compact" | "default" | "large";
  fieldGap?: number; // px gap between fields
  inputBorderRadius?: string;
}

export interface IFormLayout {
  _id?: string;
  name: string;
  description?: string;
  fields: IFormField[];
  style?: IFormStyle;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const FormFieldSchema = new Schema<IFormField>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: BOOKING_FIELD_TYPES,
      required: true,
    },
    label: { type: String, required: true },
    placeholder: { type: String, default: "" },
    required: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    width: { type: String, enum: ["full", "half", "third"], default: "full" },
    widthWhenHourly: { type: String, enum: ["full", "half", "third"], default: undefined },
    mobileWidth: { type: String, enum: ["full", "half", "third"], default: undefined },
    mobileWidthWhenHourly: { type: String, enum: ["full", "half", "third"], default: undefined },
    order: { type: Number, required: true },
    step: { type: Number, default: 1 },
    visibleWhen: { type: Schema.Types.Mixed, default: undefined },
    showBorder: { type: Boolean, default: undefined },
  },
  { _id: false }
);

const FormStyleSchema = new Schema<IFormStyle>(
  {
    // Container
    backgroundColor: { type: String, default: "#ffffff" },
    backgroundOpacity: { type: Number, default: 100 },
    glassEffect: { type: Boolean, default: false },
    borderRadius: { type: String, default: "0.5rem" },
    borderColor: { type: String, default: "#e5e7eb" }, // border-gray-200
    borderWidth: { type: String, default: "1px" },

    // Typography
    primaryColor: { type: String, default: "#000000" },
    headingColor: { type: String, default: "#000000" },
    labelColor: { type: String, default: "#374151" }, // gray-700
    textColor: { type: String, default: "#6b7280" }, // gray-500

    // Header & Footer
    showHeader: { type: Boolean, default: true },
    headingText: { type: String, default: "Book Your Ride" },
    subHeadingText: { type: String, default: "Book your ride in seconds" },
    headingAlignment: { type: String, enum: ["left", "center", "right"], default: "center" },
    showFooter: { type: Boolean, default: true },
    footerText: { type: String, default: "By submitting my data I agree to be contacted" },
    showSteps: { type: Boolean, default: true },
    showFooterImages: { type: Boolean, default: true },
    columns: { type: Number, default: 2, min: 1, max: 4 },

    // Submit Button
    buttonText: { type: String, default: "Search" },
    buttonColor: { type: String, default: "#0f172a" },
    buttonTextColor: { type: String, default: "#ffffff" },
    buttonWidth: { type: String, enum: ["full", "two-thirds", "half", "third", "quarter"], default: "full" },
    buttonAlignment: { type: String, enum: ["left", "center", "right"], default: "center" },
    buttonPosition: { type: Number, default: undefined },
    
    // Components
    inputBackgroundColor: { type: String, default: "#ffffff" },
    inputBorderColor: { type: String, default: "#e5e7eb" },
    inputTextColor: { type: String, default: "#000000" },

    // Layout & Polish
    showLabels: { type: Boolean, default: false },
    inputSize: { type: String, enum: ["compact", "default", "large"], default: "default" },
    fieldGap: { type: Number, default: 12, min: 4, max: 32 },
    inputBorderRadius: { type: String, default: "0.5rem" },
  },
  { _id: false }
);

const FormLayoutSchema = new Schema<IFormLayout>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    fields: { type: [FormFieldSchema], default: [] },
    style: { type: FormStyleSchema, default: () => ({}) },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Delete the model if it exists to prevent "OverwriteModelError" or stale schema usage in dev
if (process.env.NODE_ENV === "development" && models.FormLayout) {
  delete models.FormLayout;
}

const FormLayout =
  models.FormLayout || model<IFormLayout>("FormLayout", FormLayoutSchema);

export default FormLayout;
