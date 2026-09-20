"use client";

import React, { useEffect, useState } from "react";
import "@/shared/style/embeddable-layout.css";
import Image from "next/image";
import {
  Clock,
  MapPin,
  ArrowRight,
  RefreshCw,
  Users,
  Calendar,
  AlertCircle,
  X,
  Timer,
  Car,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card } from "@/shared/ui/card";
import { useStep1 } from "@/features/booking/hooks/form-steps/useStep1";
import { useBookingStops } from "@/features/booking/hooks/useBookingStops";
import { useIframeBodyResize } from "@/features/booking/hooks/useIframeBodyResize";
import { MIN_PASSENGERS } from "@/features/booking/lib/passenger-limits";
import { useTranslations } from "next-intl";
import { useBookingForm } from "@/features/booking/context/booking-form-context";
import type { IFormLayout, IFormField } from "@/features/form-builder/model";
import { CUSTOM_EMBEDDABLE_DEFAULT_STYLE } from "@/features/booking/ui/embeddable/custom-embeddable-default-style";
import { useCustomEmbeddableFieldRenderers } from "@/features/booking/ui/embeddable/custom-embeddable-field-renderers";
import { CustomEmbeddableFormShell } from "@/features/booking/ui/embeddable/custom-embeddable-form-shell";

export function DynamicBookingForm({ layout }: { layout: IFormLayout }) {
  const t = useTranslations("embeddable");
  const { setFormData } = useBookingForm();
  const {
    mapLoaded,
    mapRef,
    pickupInputRef,
    dropoffInputRef,
    stopInputRefs,
    formData,
    errors,
    calculatingDistance,
    isLoading,
    redirectToStep2,
    handleBookingTypeChange,
    handleTripTypeChange,
    handleInputChange,
    handleInputBlur,
  } = useStep1();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useIframeBodyResize();

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const isHourly = formData.bookingType === "hourly";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.passengers < MIN_PASSENGERS) {
      handleInputChange("passengers", MIN_PASSENGERS);
    }
    redirectToStep2();
  };

  const {
    handleAddStop,
    handleRemoveStop,
    handleStopDurationChange,
  } = useBookingStops(formData, setFormData);

  // ─── Resolve layout data ─────────────────────────────────────────────────
  const style = layout.style || CUSTOM_EMBEDDABLE_DEFAULT_STYLE;
  const fields = layout.fields
    .filter((f) => f.enabled)
    .sort((a, b) => a.order - b.order);

  // Build a set of enabled field types for quick lookup
  const enabledFieldTypes = new Set(fields.map((f) => f.type));

  // Convert hex to rgba
  const getRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: getRgba(style.backgroundColor, style.backgroundOpacity),
    borderRadius: style.borderRadius,
    backdropFilter: style.glassEffect ? "blur(12px)" : "none",
    WebkitBackdropFilter: style.glassEffect ? "blur(12px)" : "none",
    border: style.glassEffect
      ? "1px solid rgba(255,255,255,0.2)"
      : `${style.borderWidth} solid ${style.borderColor}`,
    boxShadow: style.glassEffect
      ? "0 8px 32px 0 rgba(31, 38, 135, 0.15)"
      : "0 1px 3px 0 rgba(0,0,0,0.1)",
  };

  const inputPadding = style.inputSize === "compact" ? "py-1 sm:py-1.5" : style.inputSize === "large" ? "py-3 sm:py-3.5" : "py-2 sm:py-2.5";
  const inputText = style.inputSize === "compact" ? "text-[11px] sm:text-xs" : style.inputSize === "large" ? "text-sm sm:text-base" : "text-xs sm:text-sm";
  const inputBorderRadius = style.inputBorderRadius || "0.5rem";

  const inputBaseClass =
    `border bg-white pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 ${inputPadding} ${inputText} transition-all duration-200`;

  const getInputClass = (fieldName: string) =>
    `${inputBaseClass} ${
      errors[fieldName as keyof typeof errors]
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-slate-200 focus:border-primary focus:ring-primary/20"
    }`;

  const inputStyle: React.CSSProperties = {
    backgroundColor: style.inputBackgroundColor,
    borderColor: style.inputBorderColor,
    color: style.inputTextColor,
    borderRadius: inputBorderRadius,
  };

  const iconColor = style.primaryColor;


  const { renderField, renderSubmitButton } = useCustomEmbeddableFieldRenderers({
    style,
    fields,
    formData,
    errors,
    t,
    handleBookingTypeChange,
    handleTripTypeChange,
    handleInputChange,
    handleInputBlur,
    pickupInputRef,
    dropoffInputRef,
    stopInputRefs,
    mapLoaded,
    calculatingDistance,
    isLoading,
    setFormData,
    iconColor,
    inputBaseClass,
    getInputClass,
    inputStyle,
    minDate,
    isHourly,
    handleAddStop,
    handleRemoveStop,
    handleStopDurationChange,
    enabledFieldTypes,
  });

  return (
    <CustomEmbeddableFormShell
      t={t}
      style={style}
      fields={fields}
      isMounted={isMounted}
      containerStyle={containerStyle}
      handleSubmit={handleSubmit}
      renderField={renderField}
      renderSubmitButton={renderSubmitButton}
      mapLoaded={mapLoaded}
      mapRef={mapRef}
    />
  );
}
