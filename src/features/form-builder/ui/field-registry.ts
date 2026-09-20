"use client";

import React from "react";
import {
  MapPin,
  Flag,
  Route,
  CalendarDays,
  Clock,
  Users,
  ArrowLeftRight,
  ArrowRight,
  Timer,
  ToggleLeft,
} from "lucide-react";
import type { BookingFieldType, IFormField, IFormStyle } from "@/features/form-builder/model";

export const FIELD_REGISTRY: Record<
  BookingFieldType,
  {
    labelKey: string;
    icon: React.ElementType;
    step: 1;
    required: boolean;
    locked: boolean;
    width: IFormField["width"];
    placeholderKey?: string;
    descriptionKey: string;
    visibleWhen?: IFormField["visibleWhen"];
  }
> = {
  "booking-type": {
    labelKey: "booking_type",
    icon: ToggleLeft,
    step: 1,
    required: true,
    locked: true,
    width: "full",
    descriptionKey: "field_descriptions.booking_type",
  },
  pickup: {
    labelKey: "pickup",
    icon: MapPin,
    step: 1,
    required: true,
    locked: true,
    width: "full",
    placeholderKey: "placeholders.pickup",
    descriptionKey: "field_descriptions.pickup",
  },
  stops: {
    labelKey: "stops",
    icon: Route,
    step: 1,
    required: false,
    locked: false,
    width: "full",
    descriptionKey: "field_descriptions.stops",
    visibleWhen: { bookingType: "destination" },
  },
  dropoff: {
    labelKey: "dropoff",
    icon: Flag,
    step: 1,
    required: true,
    locked: true,
    width: "full",
    placeholderKey: "placeholders.dropoff",
    descriptionKey: "field_descriptions.dropoff",
    visibleWhen: { bookingType: "destination" },
  },
  duration: {
    labelKey: "duration",
    icon: Timer,
    step: 1,
    required: true,
    locked: true,
    width: "full",
    placeholderKey: "placeholders.duration",
    descriptionKey: "field_descriptions.duration",
    visibleWhen: { bookingType: "hourly" },
  },
  "trip-type": {
    labelKey: "trip_type",
    icon: ArrowLeftRight,
    step: 1,
    required: true,
    locked: true,
    width: "full",
    descriptionKey: "field_descriptions.trip_type",
    visibleWhen: { bookingType: "destination" },
  },
  date: {
    labelKey: "date",
    icon: CalendarDays,
    step: 1,
    required: true,
    locked: true,
    width: "half",
    descriptionKey: "field_descriptions.date",
  },
  time: {
    labelKey: "time",
    icon: Clock,
    step: 1,
    required: true,
    locked: true,
    width: "half",
    descriptionKey: "field_descriptions.time",
  },
  "return-date": {
    labelKey: "return_date",
    icon: CalendarDays,
    step: 1,
    required: true,
    locked: true,
    width: "half",
    descriptionKey: "field_descriptions.return_date",
    visibleWhen: { tripType: "roundtrip" },
  },
  "return-time": {
    labelKey: "return_time",
    icon: Clock,
    step: 1,
    required: true,
    locked: true,
    width: "half",
    descriptionKey: "field_descriptions.return_time",
    visibleWhen: { tripType: "roundtrip" },
  },
  passengers: {
    labelKey: "passengers",
    icon: Users,
    step: 1,
    required: true,
    locked: false,
    width: "half",
    descriptionKey: "field_descriptions.passengers",
  },
};

export function createDefaultFields(): IFormField[] {
  return [];
}

export const DEFAULT_STYLE: IFormStyle = {
  backgroundColor: "#ffffff",
  backgroundOpacity: 90,
  glassEffect: true,
  borderRadius: "0.75rem",
  borderColor: "#e2e8f0",
  borderWidth: "0px",
  primaryColor: "#0f172a",
  headingColor: "#1e293b",
  labelColor: "#475569",
  textColor: "#64748b",
  showHeader: true,
  headingText: "Trip Booking",
  subHeadingText: "Book your ride in seconds",
  headingAlignment: "center",
  subHeadingAlignment: "center",
  showFooter: true,
  footerText: "By submitting my data I agree to be contacted",
  footerTextAlignment: "center",
  showSteps: true,
  showFooterImages: true,
  columns: 2,
  buttonText: "Search",
  buttonColor: "#0f172a",
  buttonTextColor: "#ffffff",
  buttonSize: "default",
  buttonWidth: "full",
  buttonAlignment: "center",
  buttonBorderRadius: "0.5rem",
  inputBackgroundColor: "#ffffff",
  inputBorderColor: "#e2e8f0",
  inputTextColor: "#1e293b",
  bookingTypeButtonColor: "#0f172a",
  bookingTypeButtonTextColor: "#ffffff",
  showLabels: false,
  inputSize: "default",
  fieldGap: 12,
  inputBorderRadius: "0.5rem",
  buttonPosition: undefined,
};
