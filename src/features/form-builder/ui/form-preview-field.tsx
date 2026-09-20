"use client";

import { FIELD_REGISTRY } from "@/features/form-builder/ui/field-registry";
import { SortablePreviewItem } from "@/features/form-builder/ui/sortable-preview-item";
import type { IFormField, IFormStyle } from "@/features/form-builder/model";
import {
  ArrowLeftRight,
  ArrowRight,
  Calendar,
  CalendarDays,
  Clock,
  MapPin,
  Timer,
  Users,
  X,
  RefreshCw,
} from "lucide-react";
import type { useTranslations } from "next-intl";
import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";

export function FormPreviewField({
  field,
  style,
  previewMode,
  previewBookingType,
  setPreviewBookingType,
  previewTripType,
  setPreviewTripType,
  t,
  inputBaseClass,
  onSelectField,
}: {
  field: IFormField;
  style: IFormStyle;
  previewMode: "desktop" | "mobile";
  previewBookingType: "destination" | "hourly";
  setPreviewBookingType: Dispatch<SetStateAction<"destination" | "hourly">>;
  previewTripType: "oneway" | "roundtrip";
  setPreviewTripType: Dispatch<SetStateAction<"oneway" | "roundtrip">>;
  t: ReturnType<typeof useTranslations<"FormBuilder">>;
  inputBaseClass: string;
  onSelectField?: (id: string) => void;
}) {
    const reg = FIELD_REGISTRY[field.type];
    const Icon = reg?.icon || MapPin;

    const inputStyle: CSSProperties = {
      backgroundColor: style.inputBackgroundColor,
      borderColor: style.inputBorderColor,
      color: style.inputTextColor,
      borderRadius: style.inputBorderRadius || "0.5rem",
    };

    const iconStyle: CSSProperties = { color: style.primaryColor };

    const Wrapper = ({ children }: { children: ReactNode }) => {
      const isMobileView = previewMode === "mobile";
      const cols = style.columns || 2;
      
      let effectiveWidth = field.width;
      if (!isMobileView && previewBookingType === "hourly" && field.widthWhenHourly) {
        effectiveWidth = field.widthWhenHourly;
      }
      if (isMobileView) {
        if (previewBookingType === "hourly" && field.mobileWidthWhenHourly) {
          effectiveWidth = field.mobileWidthWhenHourly;
        } else if (field.mobileWidth) {
          effectiveWidth = field.mobileWidth;
        }
      }

      // Calculate grid span based on width percentage and column count
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

      return (
        <SortablePreviewItem
          key={field.id}
          id={`preview-${field.id}`}
          className="cursor-pointer h-full"
          style={{ gridColumn: `span ${span} / span ${span}` }}
          onClick={(e) => {
             e.stopPropagation();
             onSelectField?.(field.id);
          }}
          isMobile={isMobileView}
        >
          <div className="h-full flex flex-col justify-end">
            {style.showLabels && (
              <label className="block text-xs font-medium mb-1" style={{ color: style.labelColor }}>
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
            )}
            {children}
          </div>
        </SortablePreviewItem>
      );
    };

    switch (field.type) {
      case "booking-type":
        return (
          <Wrapper>
            <div
              className={`flex ${field.showBorder !== false ? 'rounded-lg border p-1' : ''} text-sm font-medium`}
              style={{
                backgroundColor: field.showBorder !== false ? `${style.inputBorderColor}40` : 'transparent',
                borderColor: field.showBorder !== false ? style.inputBorderColor : 'transparent',
              }}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPreviewBookingType("destination"); }}
                className={`flex-1 rounded-md px-3 py-2 transition-all duration-300 flex items-center justify-center gap-1.5 text-sm font-medium ${
                  previewBookingType === "destination" ? "shadow-sm" : ""
                }`}
                style={
                  previewBookingType === "destination"
                    ? { background: style.bookingTypeButtonColor || "#0f172a", color: style.bookingTypeButtonTextColor || "#ffffff" }
                    : { color: style.textColor }
                }
              >
                <MapPin className="h-3.5 w-3.5" />
                {t("ui.destination")}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPreviewBookingType("hourly"); }}
                className={`flex-1 rounded-md px-3 py-2 transition-all duration-300 flex items-center justify-center gap-1.5 text-sm font-medium ${
                  previewBookingType === "hourly" ? "shadow-sm" : ""
                }`}
                style={
                  previewBookingType === "hourly"
                    ? { background: style.bookingTypeButtonColor || "#0f172a", color: style.bookingTypeButtonTextColor || "#ffffff" }
                    : { color: style.textColor }
                }
              >
                <Clock className="h-3.5 w-3.5" />
                {t("ui.hourly")}
              </button>
            </div>
          </Wrapper>
        );

      case "trip-type":
        return (
          <Wrapper>
            <div
              className={`flex ${field.showBorder !== false ? 'rounded-lg border p-1' : ''} text-sm font-medium`}
              style={{
                backgroundColor: field.showBorder !== false ? `${style.inputBorderColor}60` : 'transparent',
                borderColor: field.showBorder !== false ? style.inputBorderColor : 'transparent',
              }}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPreviewTripType("oneway"); }}
                className={`flex-1 rounded-md px-3 py-2 transition-all duration-300 flex items-center justify-center gap-1.5 text-sm font-medium ${
                  previewTripType === "oneway" ? "shadow-sm" : ""
                }`}
                style={
                  previewTripType === "oneway"
                    ? { background: style.bookingTypeButtonColor || "#0f172a", color: style.bookingTypeButtonTextColor || "#ffffff" }
                    : { color: style.textColor }
                }
              >
                <ArrowRight className="h-3.5 w-3.5" />
                {t("ui.one_way")}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPreviewTripType("roundtrip"); }}
                className={`flex-1 rounded-md px-3 py-2 transition-all duration-300 flex items-center justify-center gap-1.5 text-sm font-medium ${
                  previewTripType === "roundtrip" ? "shadow-sm" : ""
                }`}
                style={
                  previewTripType === "roundtrip"
                    ? { background: style.bookingTypeButtonColor || "#0f172a", color: style.bookingTypeButtonTextColor || "#ffffff" }
                    : { color: style.textColor }
                }
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t("ui.round_trip")}
              </button>
            </div>
          </Wrapper>
        );

      case "stops":
        return (
          <Wrapper>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-[3] relative">
                  <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={iconStyle}
                  >
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder={t("placeholders.stop")}
                    className={inputBaseClass}
                    style={inputStyle}
                    readOnly
                  />
                </div>
                <div className="flex-1 relative min-w-[80px]">
                  <div
                    className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={iconStyle}
                  >
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <select
                    className="w-full rounded-lg border pl-7 pr-6 py-2.5 text-xs font-medium appearance-none cursor-pointer"
                    style={inputStyle}
                  >
                    <option>—</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 hover:bg-red-50"
                  style={{ color: style.textColor }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs underline hover:opacity-80"
                  style={{ color: style.primaryColor }}
                >
                  + {t("ui.add_a_stop")}
                </button>
              </div>
            </div>
          </Wrapper>
        );

      case "pickup":
      case "dropoff":
        return (
          <Wrapper>
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={iconStyle}
              >
                <Icon className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder={field.placeholder || field.label}
                className={inputBaseClass}
                style={inputStyle}
                readOnly
              />
            </div>
          </Wrapper>
        );

      case "duration":
        return (
          <Wrapper>
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={iconStyle}
              >
                <Clock className="h-4 w-4" />
              </div>
              <input
                type="number"
                placeholder={t("placeholders.duration")}
                min={1}
                defaultValue={2}
                className={inputBaseClass}
                style={inputStyle}
                readOnly
              />
            </div>
          </Wrapper>
        );

      case "date":
      case "return-date":
        return (
          <Wrapper>
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={iconStyle}
              >
                <Calendar className="h-4 w-4" />
              </div>
              <input
                type="date"
                className={inputBaseClass}
                style={inputStyle}
                readOnly
              />
            </div>
          </Wrapper>
        );

      case "time":
      case "return-time":
        return (
          <Wrapper>
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={iconStyle}
              >
                <Clock className="h-4 w-4" />
              </div>
              <input
                type="time"
                className={inputBaseClass}
                style={inputStyle}
                readOnly
              />
            </div>
          </Wrapper>
        );

      case "passengers":
        return (
          <Wrapper>
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={iconStyle}
              >
                <Users className="h-4 w-4" />
              </div>
              <input
                type="number"
                placeholder={t("placeholders.passengers")}
                min={1}
                max={15}
                defaultValue={1}
                className={inputBaseClass}
                style={inputStyle}
                readOnly
              />
            </div>
          </Wrapper>
        );

      default:
        return (
          <Wrapper>
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={iconStyle}
              >
                <Icon className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder={
                  field.placeholder || 
                  (reg?.placeholderKey ? t(reg.placeholderKey) : (reg ? t(reg.labelKey) : field.label))
                }
                className={inputBaseClass}
                style={inputStyle}
                readOnly
              />
            </div>
          </Wrapper>
        );
    }
  }
