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
import { STOP_WAIT_OPTIONS_10_MIN } from "@/lib/form/stop-wait-duration-options";

type Ctx = CustomEmbeddableFieldCtx;

export function createLocationFieldRenderers(ctx: Ctx) {
  const {
    style,
    formData,
    t,
    pickupInputRef,
    dropoffInputRef,
    stopInputRefs,
    iconColor,
    inputBaseClass,
    getInputClass,
    inputStyle,
    handleAddStop,
    handleRemoveStop,
    handleStopDurationChange,
    handleInputChange,
    handleInputBlur,
    setFormData,
    enabledFieldTypes,
    FieldLabel,
    errors,
  } = ctx;
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
                {STOP_WAIT_OPTIONS_10_MIN.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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


  return { renderPickup, renderStops, renderDropoff };
}
