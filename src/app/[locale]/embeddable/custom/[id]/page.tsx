"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "@/style/EmbeddableLayout.css";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useStep1 } from "@/hooks/form/form-steps/useStep1";
import { useTranslations } from "next-intl";
import {
  BookingFormProvider,
  useBookingForm,
} from "@/contexts/BookingFormContext";
import type { IFormLayout, IFormField, IFormStyle } from "@/models/form-layout";

// ─── Default Style Fallback ────────────────────────────────────────────────
const DEFAULT_STYLE: IFormStyle = {
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
  showFooter: true,
  footerText: "By submitting my data I agree to be contacted",
  showSteps: true,
  showFooterImages: true,
  inputBackgroundColor: "#ffffff",
  inputBorderColor: "#e2e8f0",
  inputTextColor: "#1e293b",
  buttonText: "",
  buttonColor: "",
  buttonTextColor: "",
  buttonWidth: "auto",
  buttonAlignment: "center",
  showLabels: false,
  inputSize: "default",
  fieldGap: 12,
  inputBorderRadius: "0.5rem",
};

// ─── Dynamic Booking Form ──────────────────────────────────────────────────
function DynamicBookingForm({ layout }: { layout: IFormLayout }) {
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

  // Iframe resize observer
  useEffect(() => {
    if (typeof window === "undefined") return;
    const postHeight = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: "meetswiss-resize", height }, "*");
    };
    const resizeObserver = new ResizeObserver(() => postHeight());
    resizeObserver.observe(document.body);
    const mutationObserver = new MutationObserver(() => postHeight());
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    postHeight();
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const isHourly = formData.bookingType === "hourly";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.passengers < 1) {
      handleInputChange("passengers", 1);
    }
    redirectToStep2();
  };

  // Stop handlers
  const handleAddStop = () => {
    const newStop = {
      location: "",
      order: formData.stops.length + 1,
      duration: 0,
    };
    setFormData((prev) => ({ ...prev, stops: [...prev.stops, newStop] }));
  };

  const handleRemoveStop = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops
        .filter((_, i) => i !== index)
        .map((stop, i) => ({ ...stop, order: i + 1 })),
    }));
  };

  const handleStopDurationChange = (index: number, duration: number) => {
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops.map((stop, i) =>
        i === index ? { ...stop, duration } : stop
      ),
    }));
  };

  // ─── Resolve layout data ─────────────────────────────────────────────────
  const style = layout.style || DEFAULT_STYLE;
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

  // Label helper
  const FieldLabel = ({ field }: { field: IFormField }) => {
    if (!style.showLabels) return null;
    return (
      <label className="block text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1" style={{ color: style.labelColor }}>
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    );
  };

  // ─── Field Renderers ──────────────────────────────────────────────────────
  const renderBookingType = (field: IFormField) => (
    <div key={field.id}>
      <div
        className="flex rounded-lg border p-1 text-xs sm:text-sm font-medium mb-3"
        style={{
          backgroundColor: `${style.inputBorderColor}40`,
          borderColor: style.inputBorderColor,
        }}
      >
        {(["destination", "hourly"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleBookingTypeChange(type)}
            className={`flex-1 rounded-md px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
              formData.bookingType === type
                ? "text-white shadow-sm font-medium"
                : "hover:bg-slate-100"
            }`}
            style={
              formData.bookingType === type
                ? {
                    background: `linear-gradient(to right, ${iconColor}cc, ${iconColor})`,
                  }
                : { color: style.textColor }
            }
          >
            {type === "destination" ? (
              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
            ) : (
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
            )}
            <span>
              {type === "destination"
                ? t("destination")
                : t("hourly")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPickup = (field: IFormField) => (
    <div key={field.id}>
      <FieldLabel field={field} />
      <div className="relative">
        <div
          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2"
          style={{ color: iconColor }}
        >
          <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
        </div>
        <Input
          ref={pickupInputRef}
          placeholder={field.placeholder || t("pickup-location")}
          value={formData.pickup}
          onChange={(e) => handleInputChange("pickup", e.target.value)}
          onBlur={() => handleInputBlur("pickup")}
          className={`w-full ${getInputClass("pickup")}`}
          style={inputStyle}
        />
      </div>
      {errors.pickup && (
        <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          <span className="truncate">{errors.pickup}</span>
        </div>
      )}
    </div>
  );

  const renderStops = (field: IFormField) => (
    <div key={field.id} className="space-y-2">
      {formData.stops.map((stop, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-[3]">
              <div
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: iconColor }}
              >
                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
              </div>
              <Input
                ref={(el) => {
                  if (stopInputRefs.current) {
                    stopInputRefs.current[index] = el;
                  }
                }}
                placeholder={t("stop-index-1-location", {
                  0: index + 1,
                })}
                value={stop.location}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stops: prev.stops.map((s, i) =>
                      i === index ? { ...s, location: e.target.value } : s
                    ),
                  }))
                }
                className={`w-full ${inputBaseClass}`}
                style={inputStyle}
              />
            </div>
            <div className="relative flex-1 min-w-[80px] sm:min-w-[90px]">
              <div
                className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                style={{ color: iconColor }}
              >
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
              <select
                value={stop.duration || 0}
                onChange={(e) =>
                  handleStopDurationChange(index, parseInt(e.target.value))
                }
                className="w-full rounded-lg border pl-6 sm:pl-7 pr-6 sm:pr-7 py-2 sm:py-2.5 text-xs font-medium cursor-pointer appearance-none"
                style={{
                  ...inputStyle,
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.25rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.15em 1.15em",
                }}
              >
                <option value={0}>—</option>
                <option value={10}>10m</option>
                <option value={20}>20m</option>
                <option value={30}>30m</option>
                <option value={40}>40m</option>
                <option value={50}>50m</option>
                <option value={60}>1h</option>
                <option value={70}>1h 10m</option>
                <option value={80}>1h 20m</option>
                <option value={90}>1h 30m</option>
                <option value={100}>1h 40m</option>
                <option value={110}>1h 50m</option>
                <option value={120}>2h</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleRemoveStop(index)}
            className="flex-shrink-0 p-1 sm:p-1.5 rounded-lg hover:text-red-500 hover:bg-red-50 transition-all duration-200"
            style={{ color: style.textColor }}
          >
            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
          </button>
        </div>
      ))}
    </div>
  );

  const renderDropoff = (field: IFormField) => (
    <div key={field.id}>
      <FieldLabel field={field} />
      {enabledFieldTypes.has("stops") && (
        <div className="flex justify-end mb-1.5 w-full">
          <button
            type="button"
            onClick={handleAddStop}
            className="text-xs underline hover:opacity-80"
            style={{ color: iconColor }}
          >
            {t("add-a-stop")}
          </button>
        </div>
      )}
      <div className="relative">
        <div
          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2"
          style={{ color: iconColor }}
        >
          <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
        </div>
        <Input
          ref={dropoffInputRef}
          placeholder={field.placeholder || t("destination")}
          value={formData.dropoff}
          onChange={(e) => handleInputChange("dropoff", e.target.value)}
          onBlur={() => handleInputBlur("dropoff")}
          className={`w-full ${getInputClass("dropoff")}`}
          style={inputStyle}
        />
      </div>
      {errors.dropoff && (
        <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          <span className="truncate">{errors.dropoff}</span>
        </div>
      )}
    </div>
  );

  const renderDuration = (field: IFormField) => (
    <div key={field.id}>
      <FieldLabel field={field} />
      <div className="relative">
        <div
          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2"
          style={{ color: iconColor }}
        >
          <Timer className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
        </div>
        <Input
          type="number"
          placeholder={field.placeholder || t("duration-hours")}
          min={1}
          value={formData.duration}
          onChange={(e) => handleInputChange("duration", Number(e.target.value))}
          className={`w-full ${inputBaseClass}`}
          style={inputStyle}
        />
      </div>
    </div>
  );

  const renderTripType = (field: IFormField) => (
    <div key={field.id}>
      <div
        className="flex rounded-lg border p-1 text-xs sm:text-sm font-medium"
        style={{
          backgroundColor: `${style.inputBorderColor}60`,
          borderColor: style.inputBorderColor,
        }}
      >
        <button
          type="button"
          onClick={() => handleTripTypeChange("oneway")}
          className={`flex-1 rounded-md px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
            formData.tripType === "oneway"
              ? "shadow-sm font-medium"
              : "hover:bg-slate-100"
          }`}
          style={
            formData.tripType === "oneway"
              ? {
                  backgroundColor: style.inputBackgroundColor,
                  color: style.inputTextColor,
                }
              : { color: style.textColor }
          }
        >
          <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
          <span>{t("one-way")}</span>
        </button>
        <button
          type="button"
          onClick={() => handleTripTypeChange("roundtrip")}
          className={`flex-1 rounded-md px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
            formData.tripType === "roundtrip"
              ? "shadow-sm font-medium"
              : "hover:bg-slate-100"
          }`}
          style={
            formData.tripType === "roundtrip"
              ? {
                  backgroundColor: style.inputBackgroundColor,
                  color: style.inputTextColor,
                }
              : { color: style.textColor }
          }
        >
          <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
          <span>{t("round-trip")}</span>
        </button>
      </div>
    </div>
  );

  const renderDateField = (field: IFormField) => {
    const isReturn = field.type === "return-date";
    const value = isReturn ? formData.returnDate : formData.date;
    const fieldKey = isReturn ? "returnDate" : "date";
    const error = errors[fieldKey as keyof typeof errors];

    return (
      <div key={field.id}>
        <FieldLabel field={field} />
        <div className="relative">
          <div
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2"
            style={{ color: iconColor }}
          >
            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
          </div>
          <Input
            type="date"
            value={value}
            min={minDate}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            className={`w-full ${getInputClass(fieldKey)}`}
            style={inputStyle}
          />
        </div>
        {error && (
          <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            <span className="truncate">{error}</span>
          </div>
        )}
      </div>
    );
  };

  const renderTimeField = (field: IFormField) => {
    const isReturn = field.type === "return-time";
    const value = isReturn ? formData.returnTime : formData.time;
    const fieldKey = isReturn ? "returnTime" : "time";
    const error = errors[fieldKey as keyof typeof errors];

    return (
      <div key={field.id}>
        <FieldLabel field={field} />
        <div className="relative">
          <div
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2"
            style={{ color: iconColor }}
          >
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
          </div>
          <Input
            type="time"
            value={value}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            className={`w-full ${getInputClass(fieldKey)}`}
            style={inputStyle}
          />
        </div>
        {error && (
          <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            <span className="truncate">{error}</span>
          </div>
        )}
      </div>
    );
  };

  const renderPassengers = (field: IFormField) => (
    <div key={field.id}>
      <FieldLabel field={field} />
      <div className="relative">
        <div
          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2"
          style={{ color: iconColor }}
        >
          <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
        </div>
        <Input
        type="number"
        placeholder={field.placeholder || t("passengers")}
        value={formData.passengers}
        max="15"
        onChange={(e) => {
          const value = e.target.value;
          if (value === "") {
            handleInputChange("passengers", "");
            return;
          }
          const numValue = Number(value);
          if (!isNaN(numValue) && numValue >= 0) {
            handleInputChange("passengers", numValue);
          }
        }}
        onBlur={() => {
          if (Number(formData.passengers) < 1) {
            handleInputChange("passengers", 1);
          }
          handleInputBlur("passengers");
        }}
        className={`w-full ${getInputClass("passengers")}`}
        style={inputStyle}
      />
      {errors.passengers && (
        <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          <span className="truncate">{errors.passengers}</span>
        </div>
      )}
      </div>
    </div>
  );

  // ─── Field dispatcher ─────────────────────────────────────────────────────
  const renderField = (field: IFormField) => {
    // Conditional visibility: skip fields that don't match current state
    if (field.visibleWhen?.bookingType) {
      if (formData.bookingType !== field.visibleWhen.bookingType) return null;
    }
    if (field.visibleWhen?.tripType) {
      if (formData.tripType !== field.visibleWhen.tripType) return null;
    }

    const fieldContent = (() => {
      switch (field.type) {
        case "booking-type":
          return renderBookingType(field);
        case "pickup":
          return renderPickup(field);
        case "stops":
          return renderStops(field);
        case "dropoff":
          return renderDropoff(field);
        case "duration":
          return renderDuration(field);
        case "trip-type":
          return renderTripType(field);
        case "date":
        case "return-date":
          return renderDateField(field);
        case "time":
        case "return-time":
          return renderTimeField(field);
        case "passengers":
          return renderPassengers(field);
        default:
          return null;
      }
    })();

    if (!fieldContent) return null;

    const cols = style.columns || 2;
    // Use conditional width when in hourly mode
    const effectiveWidth = (formData.bookingType === "hourly" && field.widthWhenHourly)
      ? field.widthWhenHourly
      : field.width;
    const span = effectiveWidth === "full" 
      ? cols 
      : effectiveWidth === "half" 
        ? Math.max(1, Math.ceil(cols / 2)) 
        : Math.max(1, Math.ceil(cols / 3));

    return (
      <div
        key={field.id}
        style={{ gridColumn: `span ${span} / span ${span}` }}
      >
        {fieldContent}
      </div>
    );
  };

  // ─── Group date/time pairs side-by-side ───────────────────────────────────
  const renderFields = () => {
    return fields.map((field) => renderField(field));
  };

  const renderSubmitButton = () => {
    const cols = style.columns || 2;
    const width = style.buttonWidth || "auto";
    let span = width === "full" ? cols : 1;
    if (width === "half") {
      span = Math.max(1, Math.floor(cols / 2));
    }
    const isFullWidthRow = width === "full";
    
    const alignment = style.buttonAlignment || "center";
    const justify = alignment === "left" ? "flex-start" : alignment === "right" ? "flex-end" : "center";

    return (
      <div
        key="submit-btn"
        style={{
          gridColumn: isFullWidthRow ? "1 / -1" : `span ${span} / span ${span}`,
          display: "flex",
          justifyContent: isFullWidthRow ? justify : undefined,
          alignItems: "flex-end",
        }}
      >
        <Button
          type="submit"
          className="rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            width: "100%", // Valid fix for "its just small" - fill the grid slot
            backgroundColor: style.buttonColor || style.primaryColor,
            color: style.buttonTextColor || "#ffffff",
          }}
          disabled={isLoading || calculatingDistance}
        >
          {isLoading || calculatingDistance ? (
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{
                  borderColor: style.buttonTextColor || "#ffffff",
                  borderTopColor: "transparent",
                }}
              />
              <span>{style.buttonText || t("search")}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>{style.buttonText || t("search")}</span>
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
            </div>
          )}
        </Button>
      </div>
    );
  };

  return (
    <div
      className={`font-sans transition-all duration-75 ease-out w-full h-full overflow-auto ${
        isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
    >
      {/* Steps Progress */}
      {style.showSteps && (
        <div className="flex justify-between items-center px-4 py-3 mb-2">
          {[
            { icon: MapPin, label: t("trip") },
            { icon: Car, label: t("vehicle") },
            { icon: CheckCircle, label: t("payment") },
          ].map(({ icon: Icon, label }, index) => (
            <div key={index} className="flex flex-1 flex-col items-center relative">
              {index < 2 && (
                <div className="absolute top-3 left-1/2 w-full h-0.5 bg-slate-200 -z-10" />
              )}
              <div
                className={`flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  index === 0
                    ? "text-white shadow-md"
                    : "border-slate-300 bg-white text-slate-400"
                }`}
                style={
                  index === 0
                    ? {
                        backgroundColor: style.primaryColor,
                        borderColor: style.primaryColor,
                      }
                    : {}
                }
              >
                <Icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
              </div>
              <span
                className={`mt-1 text-[10px] sm:text-xs font-medium ${
                  index === 0 ? "font-bold" : "text-neutral-500"
                }`}
                style={index === 0 ? { color: style.primaryColor } : {}}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Map container */}
      {mapLoaded && (
        <div className="mb-3 rounded-lg overflow-hidden h-24 sm:h-32 md:h-48">
          <div ref={mapRef} className="w-full h-full" />
        </div>
      )}

      {/* Form Card */}
      <Card
        className="p-2 sm:p-3 md:p-4 border-0 h-full flex flex-col"
        style={containerStyle}
      >
        {/* Header */}
        {style.showHeader && style.headingText && (
          <header className="mb-2 text-center">
            <h1
              className="text-sm sm:text-base md:text-lg font-bold"
              style={{
                color: style.headingColor,
                textAlign: style.headingAlignment,
              }}
            >
              {style.headingText}
            </h1>
            <p
              className="text-xs sm:text-sm mt-1"
              style={{ color: style.textColor }}
            >
              {style.subHeadingText || t("book-your-ride-in-seconds")}
            </p>
          </header>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-1">
            {fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-60">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-xs">{t("no-fields")}</p>
              </div>
            ) : (
              <div 
                className="grid items-end"
                style={{ 
                  gridTemplateColumns: `repeat(${style.columns || 2}, minmax(0, 1fr))`,
                  gap: `${style.fieldGap ?? 12}px`,
                }}
              >
                {renderFields()}
                {renderSubmitButton()}
              </div>
            )}
          </div>

          <div className="mt-auto pt-2 sm:pt-3">
            {/* Footer Text / Consent */}
            {style.showFooter && style.footerText && (
              <p
                className="text-xs text-center mt-3 opacity-80 px-2"
                style={{ color: style.textColor }}
              >
                {style.footerText}
              </p>
            )}

            {/* Footer Images */}
            {style.showFooterImages && (
              <div className="flex justify-center gap-2 flex-wrap pt-3 opacity-60">
                {["visa", "mastercard", "paypal", "twint", "applepay"].map(
                  (img) => (
                    <Image
                      key={img}
                      src={`/${img}.webp`}
                      alt={img}
                      width={35}
                      height={25}
                      className="h-6 w-auto"
                    />
                  )
                )}
              </div>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

// ─── Page Component ─────────────────────────────────────────────────────────
function CustomEmbeddableContent() {
  const t = useTranslations("embeddable");
  const params = useParams();
  const id = params?.id as string;
  const [layout, setLayout] = useState<IFormLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const response = await fetch(`/api/form-layouts/${id}`);
        const data = await response.json();

        if (data.success && data.data) {
          if (data.data.isActive) {
            setLayout(data.data);
          } else {
            setError(t("form-inactive"));
          }
        } else {
          setError(t("layout-not-found"));
        }
      } catch (err) {
        setError(t("failed-to-load"));
        console.error("Error fetching layout:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchLayout();
  }, [id, t]);

  // Iframe resize observer
  useEffect(() => {
    if (typeof window === "undefined") return;
    const postHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: "meetswiss-resize", height }, "*");
    };
    const observer = new ResizeObserver(() => postHeight());
    observer.observe(document.body);
    const mutationObserver = new MutationObserver(() => postHeight());
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !layout) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">
              {t("form-unavailable")}
            </p>
            <p className="text-sm text-muted-foreground">
              {error || t("unavailable-description")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <DynamicBookingForm layout={layout} />;
}

export default function CustomEmbeddablePage() {
  return (
    <BookingFormProvider>
      <CustomEmbeddableContent />
    </BookingFormProvider>
  );
}
