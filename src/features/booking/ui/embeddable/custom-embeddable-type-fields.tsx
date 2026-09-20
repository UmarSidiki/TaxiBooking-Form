"use client";

import React from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { IFormField } from "@/models/form-layout";
import type { CustomEmbeddableFieldCtx } from "@/components/embeddable/custom-embeddable-field-context";

type Ctx = CustomEmbeddableFieldCtx;

export function createTypeFieldRenderers(ctx: Ctx) {
  const {
    style,
    formData,
    t,
    handleBookingTypeChange,
    handleTripTypeChange,
    handleInputChange,
    iconColor,
    inputBaseClass,
    inputStyle,
    FieldLabel,
  } = ctx;
  const renderBookingType = (field: IFormField) => {
    const hasBorder = field.showBorder !== false;
    console.log("Booking Type field:", field.id, "showBorder:", field.showBorder, "hasBorder:", hasBorder);
    return (
    <div key={field.id}>
      {hasBorder ? (
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
                  ? "shadow-sm font-medium"
                  : "hover:bg-slate-100"
              }`}
              style={
                formData.bookingType === type
                  ? {
                      background: style.bookingTypeButtonColor || iconColor,
                      color: style.bookingTypeButtonTextColor || "#ffffff",
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
      ) : (
        <div className="flex gap-2 mb-3">
          {(["destination", "hourly"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleBookingTypeChange(type)}
              className={`flex-1 rounded-md px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 font-medium ${
                formData.bookingType === type
                  ? "shadow-md"
                  : "hover:opacity-75"
              }`}
              style={
                formData.bookingType === type
                  ? {
                      background: style.bookingTypeButtonColor || iconColor,
                      color: style.bookingTypeButtonTextColor || "#ffffff",
                    }
                  : { 
                      background: "transparent",
                      color: style.textColor,
                      border: "none"
                    }
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
      )}
    </div>
    );
  };

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

  const renderTripType = (field: IFormField) => {
    const hasBorder = field.showBorder !== false;
    console.log("Trip Type field:", field.id, "showBorder:", field.showBorder, "hasBorder:", hasBorder);
    return (
    <div key={field.id}>
      {hasBorder ? (
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
                    background: style.bookingTypeButtonColor || iconColor,
                    color: style.bookingTypeButtonTextColor || "#ffffff",
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
                    background: style.bookingTypeButtonColor || iconColor,
                    color: style.bookingTypeButtonTextColor || "#ffffff",
                  }
                : { color: style.textColor }
            }
          >
            <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
            <span>{t("round-trip")}</span>
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleTripTypeChange("oneway")}
            className={`flex-1 rounded-md px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 font-medium ${
              formData.tripType === "oneway"
                ? "shadow-md"
                : "hover:opacity-75"
            }`}
            style={
              formData.tripType === "oneway"
                ? {
                    background: style.bookingTypeButtonColor || iconColor,
                    color: style.bookingTypeButtonTextColor || "#ffffff",
                  }
                : { 
                    background: "transparent",
                    color: style.textColor,
                    border: "none"
                  }
            }
          >
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
            <span>{t("one-way")}</span>
          </button>
          <button
            type="button"
            onClick={() => handleTripTypeChange("roundtrip")}
            className={`flex-1 rounded-md px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 font-medium ${
              formData.tripType === "roundtrip"
                ? "shadow-md"
                : "hover:opacity-75"
            }`}
            style={
              formData.tripType === "roundtrip"
                ? {
                    background: style.bookingTypeButtonColor || iconColor,
                    color: style.bookingTypeButtonTextColor || "#ffffff",
                  }
                : { 
                    background: "transparent",
                    color: style.textColor,
                    border: "none"
                  }
            }
          >
            <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
            <span>{t("round-trip")}</span>
          </button>
        </div>
      )}
    </div>
    );
  };


  return { renderBookingType, renderDuration, renderTripType };
}
