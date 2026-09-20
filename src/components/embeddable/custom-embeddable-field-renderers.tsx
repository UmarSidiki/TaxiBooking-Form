"use client";

import { createLocationFieldRenderers } from "@/components/embeddable/custom-embeddable-location-fields";
import { createScheduleFieldRenderers } from "@/components/embeddable/custom-embeddable-schedule-fields";
import { createTypeFieldRenderers } from "@/components/embeddable/custom-embeddable-type-fields";
import type {
  CustomEmbeddableFieldCtx,
  CustomEmbeddableFieldRendererProps,
} from "@/components/embeddable/custom-embeddable-field-context";
import { Button } from "@/components/ui/button";
import type { IFormField } from "@/models/form-layout";
import { ArrowRight } from "lucide-react";

export type { CustomEmbeddableFieldRendererProps };

export function useCustomEmbeddableFieldRenderers(
  props: CustomEmbeddableFieldRendererProps
) {
  const { style, fields, formData, t, isLoading, calculatingDistance } = props;

  const FieldLabel = ({ field }: { field: IFormField }) => {
    if (!style.showLabels) return null;
    return (
      <label className="block text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1" style={{ color: style.labelColor }}>
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    );
  };

  const ctx: CustomEmbeddableFieldCtx = { ...props, FieldLabel };
  const { renderBookingType, renderDuration, renderTripType } =
    createTypeFieldRenderers(ctx);
  const { renderPickup, renderStops, renderDropoff } =
    createLocationFieldRenderers(ctx);
  const { renderDateField, renderTimeField, renderPassengers } =
    createScheduleFieldRenderers(ctx);

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
    
    // Calculate desktop span
    let span = 1;
    if (effectiveWidth === "full") {
      span = cols;
    } else if (effectiveWidth === "two-thirds") {
      span = Math.max(1, Math.round((cols * 2) / 3));
    } else if (effectiveWidth === "half") {
      span = Math.max(1, Math.ceil(cols / 2));
    } else if (effectiveWidth === "third") {
      span = Math.max(1, Math.ceil(cols / 3));
    } else if (effectiveWidth === "quarter") {
      span = Math.max(1, Math.ceil(cols / 4));
    }

    // Calculate mobile span (for screens < 640px)
    const mobileEffectiveWidth = field.mobileWidth || effectiveWidth;
    let mobileSpan = 1;
    if (mobileEffectiveWidth === "full") {
      mobileSpan = cols;
    } else if (mobileEffectiveWidth === "two-thirds") {
      mobileSpan = Math.max(1, Math.round((cols * 2) / 3));
    } else if (mobileEffectiveWidth === "half") {
      mobileSpan = Math.max(1, Math.ceil(cols / 2));
    } else if (mobileEffectiveWidth === "third") {
      mobileSpan = Math.max(1, Math.ceil(cols / 3));
    } else if (mobileEffectiveWidth === "quarter") {
      mobileSpan = Math.max(1, Math.ceil(cols / 4));
    }

    return (
      <div
        key={field.id}
        className="field-responsive-width"
        style={{ 
          gridColumn: `span ${span} / span ${span}`,
          ['--mobile-span' as any]: mobileSpan 
        }}
      >
        {fieldContent}
      </div>
    );
  };

  const renderSubmitButton = () => {
    const cols = style.columns || 2;
    const width = style.buttonWidth || "full";
    
    let span = 1;
    if (width === "full") span = cols;
    else if (width === "two-thirds") span = Math.round(cols * 2 / 3);
    else if (width === "half") span = Math.max(1, Math.ceil(cols / 2));
    else if (width === "third") span = Math.max(1, Math.ceil(cols / 3));
    else if (width === "quarter") span = Math.max(1, Math.ceil(cols / 4));
    
    const isFullWidthRow = width === "full";
    
    const alignment = style.buttonAlignment || "center";
    const justify = alignment === "left" ? "flex-start" : alignment === "right" ? "flex-end" : "center";

    return (
      <div
        key="submit-btn"
        className="field-responsive-width"
        style={{
          gridColumn: isFullWidthRow ? "1 / -1" : `span ${span} / span ${span}`,
          display: "flex",
          justifyContent: isFullWidthRow ? justify : undefined,
          alignItems: "flex-end",
          ['--mobile-span' as any]: cols // Force full width on mobile for button
        }}
      >
        <Button
          type="submit"
          className={`font-semibold tracking-wide transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed w-full ${
            style.buttonSize === 'small' ? 'py-1.5 text-xs rounded' :
            style.buttonSize === 'large' ? 'py-3.5 text-base sm:py-4 sm:text-lg rounded-lg' :
            'py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg'
          }`}
          style={{
            backgroundColor: style.buttonColor || style.primaryColor,
            color: style.buttonTextColor || "#ffffff",
            borderRadius: style.buttonBorderRadius || '0.5rem',
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
              <ArrowRight className={style.buttonSize === 'small' ? 'h-2.5 w-2.5' : style.buttonSize === 'large' ? 'h-5 w-5 sm:h-5 sm:w-5' : 'h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4'} />
            </div>
          )}
        </Button>
      </div>
    );
  };

  return { renderField, renderSubmitButton };
}
