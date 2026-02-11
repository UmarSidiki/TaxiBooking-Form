/**
 * Memoized form field component to prevent unnecessary re-renders
 */

import React, { memo } from 'react';
import {
  MapPin,
  Flag,
  Route,
  CalendarDays,
  Clock,
  Users,
  ArrowLeftRight,
  ArrowRight,
  RefreshCw,
  Timer,
  ToggleLeft,
  Calendar,
  X,
  CheckCircle,
} from 'lucide-react';
import type { IFormField, IFormStyle, BookingFieldType } from '@/models/form-layout';

interface MemoizedFormFieldProps {
  field: IFormField;
  style: IFormStyle;
  onSelectField?: (id: string) => void;
}

const FIELD_ICONS: Record<BookingFieldType, React.ElementType> = {
  'booking-type': ToggleLeft,
  'pickup': MapPin,
  'dropoff': Flag,
  'stops': Route,
  'trip-type': ArrowLeftRight,
  'date': CalendarDays,
  'time': Clock,
  'return-date': CalendarDays,
  'return-time': Clock,
  'passengers': Users,
  'duration': Timer,
  'search-button': CheckCircle,
};

const MemoizedFormField = memo<MemoizedFormFieldProps>(({ field, style, onSelectField }) => {
  const Icon = FIELD_ICONS[field.type] || MapPin;
  
  const inputBaseClass =
    "w-full rounded-lg border pl-9 pr-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2";

  const inputStyle: React.CSSProperties = {
    backgroundColor: style.inputBackgroundColor,
    borderColor: style.inputBorderColor,
    color: style.inputTextColor,
  };

  const iconStyle: React.CSSProperties = { color: style.primaryColor };

  const cols = style.columns || 2;
  const span = field.width === "full" 
    ? cols 
    : field.width === "half" 
      ? Math.max(1, Math.floor(cols / 2)) 
      : 1;

  const renderFieldContent = () => {
    switch (field.type) {
      case "booking-type":
        return (
          <div
            className="flex rounded-lg border p-1 text-sm font-medium"
            style={{
              backgroundColor: `${style.inputBorderColor}40`,
              borderColor: style.inputBorderColor,
            }}
          >
            <button
              type="button"
              className="flex-1 rounded-md px-3 py-2 transition-all duration-300 flex items-center justify-center gap-1.5 text-white shadow-sm text-sm font-medium"
              style={{
                background: `linear-gradient(to right, ${style.primaryColor}cc, ${style.primaryColor})`,
              }}
              aria-label="Destination booking"
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Destination
            </button>
            <button
              type="button"
              className="flex-1 rounded-md px-3 py-2 transition-all duration-300 flex items-center justify-center gap-1.5 text-sm"
              style={{ color: style.textColor }}
              aria-label="Hourly booking"
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Hourly
            </button>
          </div>
        );

      case "trip-type":
        return (
          <div
            className="flex rounded-lg border p-1 text-sm font-medium"
            style={{
              backgroundColor: `${style.inputBorderColor}60`,
              borderColor: style.inputBorderColor,
            }}
          >
            <button
              type="button"
              className="flex-1 rounded-md px-3 py-2 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm text-sm font-medium"
              style={{
                backgroundColor: style.inputBackgroundColor,
                color: style.inputTextColor,
              }}
              aria-label="One way trip"
            >
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              One Way
            </button>
            <button
              type="button"
              className="flex-1 rounded-md px-3 py-2 transition-all duration-300 flex items-center justify-center gap-1.5 text-sm"
              style={{ color: style.textColor }}
              aria-label="Round trip"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Round Trip
            </button>
          </div>
        );

      case "stops":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-[3] relative">
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                  style={iconStyle}
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  placeholder="Stop 1 location"
                  className={inputBaseClass}
                  style={inputStyle}
                  readOnly
                  aria-label="Stop 1 location"
                />
              </div>
              <div className="flex-1 relative min-w-[80px]">
                <div
                  className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                  style={iconStyle}
                >
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <select
                  className="w-full rounded-lg border pl-7 pr-6 py-2.5 text-xs font-medium appearance-none cursor-pointer"
                  style={inputStyle}
                  aria-label="Stop duration"
                >
                  <option>—</option>
                </select>
              </div>
              <button
                type="button"
                className="flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 hover:bg-red-50"
                style={{ color: style.textColor }}
                aria-label="Remove stop"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs underline hover:opacity-80"
                style={{ color: style.primaryColor }}
                aria-label="Add a stop"
              >
                + Add a stop
              </button>
            </div>
          </div>
        );

      case "pickup":
      case "dropoff":
      case "duration":
        return (
          <div className="relative">
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={iconStyle}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <input
              type={field.type === "duration" ? "number" : "text"}
              placeholder={field.placeholder || field.label}
              className={inputBaseClass}
              style={inputStyle}
              readOnly
              min={field.type === "duration" ? 1 : undefined}
              aria-label={field.label}
            />
          </div>
        );

      case "date":
      case "return-date":
        return (
          <div className="relative">
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
              style={iconStyle}
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
            </div>
            <input
              type="date"
              className={inputBaseClass}
              style={inputStyle}
              readOnly
              aria-label={field.label}
            />
          </div>
        );

      case "time":
      case "return-time":
        return (
          <div className="relative">
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
              style={iconStyle}
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
            </div>
            <input
              type="time"
              className={inputBaseClass}
              style={inputStyle}
              readOnly
              aria-label={field.label}
            />
          </div>
        );

      case "passengers":
        return (
          <div className="relative">
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
              style={iconStyle}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
            </div>
            <input
              type="number"
              placeholder="Passengers"
              min={1}
              max={15}
              defaultValue={1}
              className={inputBaseClass}
              style={inputStyle}
              readOnly
              aria-label="Number of passengers"
            />
          </div>
        );

      case "search-button":
        return (
          <div
            className="w-full py-3 px-4 rounded-lg text-center font-bold text-sm shadow-sm transition-all duration-200"
            style={{
              backgroundColor: style.buttonColor,
              color: style.buttonTextColor,
            }}
          >
            {style.buttonText || "Search"}
          </div>
        );

      default:
        return (
          <div className="relative">
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={iconStyle}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder={field.placeholder || field.label}
              className={inputBaseClass}
              style={inputStyle}
              readOnly
              aria-label={field.label}
            />
          </div>
        );
    }
  };

  return (
    <div
      className="cursor-pointer p-1 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
      style={{ gridColumn: `span ${span} / span ${span}` }}
      onClick={(e) => {
        e.stopPropagation();
        onSelectField?.(field.id);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectField?.(field.id);
        }
      }}
      aria-label={`Edit ${field.label} field`}
      aria-pressed={false}
    >
      {renderFieldContent()}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo - deep comparison on style
  const styleEqual = 
    prevProps.style.primaryColor === nextProps.style.primaryColor &&
    prevProps.style.inputBackgroundColor === nextProps.style.inputBackgroundColor &&
    prevProps.style.inputBorderColor === nextProps.style.inputBorderColor &&
    prevProps.style.inputTextColor === nextProps.style.inputTextColor &&
    prevProps.style.textColor === nextProps.style.textColor &&
    prevProps.style.columns === nextProps.style.columns;

  return (
    prevProps.field.id === nextProps.field.id &&
    prevProps.field.label === nextProps.field.label &&
    prevProps.field.enabled === nextProps.field.enabled &&
    prevProps.field.width === nextProps.field.width &&
    prevProps.field.type === nextProps.field.type &&
    prevProps.field.placeholder === nextProps.field.placeholder &&
    styleEqual
  );
});

MemoizedFormField.displayName = 'MemoizedFormField';

export default MemoizedFormField;
