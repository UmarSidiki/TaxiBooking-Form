"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  GripVertical,
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
  Copy,
  Star,
  Monitor,
  Smartphone,
  Settings2,
  LayoutTemplate,
  Pencil,
  Check,
  X,
  Eye,
  EyeOff,
  Lock,
  ToggleLeft,
  Calendar,
  Car,
  CheckCircle,
} from "lucide-react";
import type {
  IFormLayout,
  IFormField,
  BookingFieldType,
  IFormStyle,
} from "@/models/form-layout";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/utils/api";

// ─── Booking Field Registry ─────────────────────────────────────────────────
// Each entry defines the default configuration for a booking form field.
const FIELD_REGISTRY: Record<
  BookingFieldType,
  {
    label: string;
    icon: React.ElementType;
    step: 1;
    required: boolean;
    locked: boolean;
    width: IFormField["width"];
    placeholder?: string;
    visibleWhen?: IFormField["visibleWhen"];
    description: string;
  }
> = {
  "booking-type": {
    label: "Booking Type",
    icon: ToggleLeft,
    step: 1,
    required: true,
    locked: true,
    width: "full",
    description: "Destination-based or hourly booking toggle",
  },
  pickup: {
    label: "Pickup Location",
    icon: MapPin,
    step: 1,
    required: true,
    locked: true,
    width: "full",
    placeholder: "Enter pickup address",
    description: "Google Places autocomplete for pickup address",
  },
  stops: {
    label: "Stops",
    icon: Route,
    step: 1,
    required: false,
    locked: false,
    width: "full",
    description: "Dynamic stop addresses with duration (destination only)",
    visibleWhen: { bookingType: "destination" },
  },
  dropoff: {
    label: "Dropoff Location",
    icon: Flag,
    step: 1,
    required: true,
    locked: true,
    width: "full",
    placeholder: "Enter dropoff address",
    description: "Google Places autocomplete for dropoff address",
    visibleWhen: { bookingType: "destination" },
  },
  duration: {
    label: "Duration (hours)",
    icon: Timer,
    step: 1,
    required: true,
    locked: true,
    width: "full",
    placeholder: "2",
    description: "Number of hours for hourly booking",
    visibleWhen: { bookingType: "hourly" },
  },
  "trip-type": {
    label: "Trip Type",
    icon: ArrowLeftRight,
    step: 1,
    required: true,
    locked: true,
    width: "full",
    description: "One-way or round-trip toggle (destination only)",
    visibleWhen: { bookingType: "destination" },
  },
  date: {
    label: "Date",
    icon: CalendarDays,
    step: 1,
    required: true,
    locked: true,
    width: "half",
    description: "Trip departure date",
  },
  time: {
    label: "Time",
    icon: Clock,
    step: 1,
    required: true,
    locked: true,
    width: "half",
    description: "Trip departure time",
  },
  "return-date": {
    label: "Return Date",
    icon: CalendarDays,
    step: 1,
    required: true,
    locked: true,
    width: "half",
    description: "Return trip date (round-trip only)",
    visibleWhen: { tripType: "roundtrip" },
  },
  "return-time": {
    label: "Return Time",
    icon: Clock,
    step: 1,
    required: true,
    locked: true,
    width: "half",
    description: "Return trip time (round-trip only)",
    visibleWhen: { tripType: "roundtrip" },
  },
  passengers: {
    label: "Passengers",
    icon: Users,
    step: 1,
    required: true,
    locked: true,
    width: "full",
    description: "Number of passengers (1–15)",
  },
};

// ─── Default layout with all fields ─────────────────────────────────────────
function createDefaultFields(): IFormField[] {
  return [];
}

const DEFAULT_STYLE: IFormStyle = {
  // Container
  backgroundColor: "#ffffff",
  backgroundOpacity: 90,
  glassEffect: true,
  borderRadius: "0.75rem",
  borderColor: "#e2e8f0",
  borderWidth: "0px",

  // Typography
  primaryColor: "#0f172a",
  headingColor: "#1e293b",
  labelColor: "#475569",
  textColor: "#64748b",

  // Header & Footer
  showHeader: true,
  headingText: "Trip Booking",
  subHeadingText: "Book your ride in seconds",
  headingAlignment: "center",
  showFooter: true,
  footerText: "By submitting my data I agree to be contacted",
  showSteps: true,
  showFooterImages: true,
  columns: 2,

  // Submit Button
  buttonText: "Search",
  buttonColor: "#0f172a",
  buttonTextColor: "#ffffff",
  buttonWidth: "full",
  buttonAlignment: "center",

  // Components
  inputBackgroundColor: "#ffffff",
  inputBorderColor: "#e2e8f0",
  inputTextColor: "#1e293b",
};

// ─── Step Separator ─────────────────────────────────────────────────────────
// Removed as part of single-step redesign
// function StepSeparator({ step }: { step: number }) { ... }

// ─── Sortable Field Card ────────────────────────────────────────────────────
function SortableField({
  field,
  isSelected,
  onSelect,
  onToggle,
  onRemove,
}: {
  field: IFormField;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const reg = FIELD_REGISTRY[field.type];
  const Icon = reg?.icon || MapPin;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-2.5 rounded-lg border-2 p-2.5 transition-all duration-150 cursor-pointer ${
        isDragging
          ? "opacity-50 border-primary bg-primary/5 shadow-lg"
          : !field.enabled
            ? "opacity-50 border-dashed border-border bg-muted/30"
            : isSelected
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
      }`}
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <div className="flex-shrink-0 rounded-md bg-primary/10 p-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium truncate">{field.label}</p>
          {reg?.locked && (
            <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {field.visibleWhen?.bookingType && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
              {field.visibleWhen.bookingType}
            </Badge>
          )}
          {field.visibleWhen?.tripType && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
              round-trip
            </Badge>
          )}
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
            {field.width === "full"
              ? "Full"
              : field.width === "half"
                ? "½"
                : "⅓"}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
          title={field.enabled ? "Hide in preview" : "Show in preview"}
        >
          {field.enabled ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
          title="Remove from form"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Field Preview (drag overlay) ───────────────────────────────────────────
function FieldPreview({ field }: { field: IFormField }) {
  const reg = FIELD_REGISTRY[field.type];
  const Icon = reg?.icon || MapPin;

  return (
    <div className="flex items-center gap-3 rounded-lg border-2 border-primary bg-card p-3 shadow-xl">
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <div className="rounded-md bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-sm font-medium">{field.label}</p>
    </div>
  );
}

// ─── Sortable Preview Item ──────────────────────────────────────────────────
function SortablePreviewItem({
  id,
  className,
  children,
  style: styleProp,
  onClick,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
    ...styleProp,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${className || ""}`}
      onClick={(e) => {
         if(!isDragging && onClick) onClick(e);
      }}
    >
      {/* Drag Handle - Top Right Overlay */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-0 right-0 p-1.5 cursor-grab opacity-0 group-hover:opacity-100 bg-background/80 hover:bg-background border border-border shadow-sm rounded-bl-lg rounded-tr-md z-20 transition-all"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}

// ─── Live Form Preview (Embed-style) ────────────────────────────────────────
function FormPreview({
  fields,
  style,
  onSelectField,
}: {
  fields: IFormField[];
  previewMode?: "desktop" | "mobile";
  style: IFormStyle;
  onSelectField?: (id: string) => void;
}) {
  const enabledFields = fields.filter((f) => f.enabled);

  // Convert hex to rgba for transparency
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
    color: style.textColor,
  };

  if (enabledFields.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center transition-all duration-300"
        style={containerStyle}
      >
        <div className="rounded-full bg-muted p-6 mb-4">
          <LayoutTemplate className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-base font-medium text-muted-foreground mb-1">
          No fields enabled
        </p>
        <p className="text-sm text-muted-foreground/70">
          Enable fields to see a preview
        </p>
      </div>
    );
  }

  const inputBaseClass =
    "w-full rounded-lg border pl-9 pr-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2";

  const renderField = (field: IFormField) => {
    const reg = FIELD_REGISTRY[field.type];
    const Icon = reg?.icon || MapPin;

    const inputStyle: React.CSSProperties = {
      backgroundColor: style.inputBackgroundColor,
      borderColor: style.inputBorderColor,
      color: style.inputTextColor,
    };

    const iconStyle: React.CSSProperties = { color: style.primaryColor };

    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      const cols = style.columns || 2;
      const span = field.width === "full" 
        ? cols 
        : field.width === "half" 
          ? Math.max(1, Math.floor(cols / 2)) 
          : 1;

      return (
        <SortablePreviewItem
          key={field.id}
          id={`preview-${field.id}`}
          className="cursor-pointer p-1"
          style={{ gridColumn: `span ${span} / span ${span}` }}
          onClick={(e) => {
             e.stopPropagation();
             onSelectField?.(field.id);
          }}
        >
          {children}
        </SortablePreviewItem>
      );
    };

    switch (field.type) {
      case "booking-type":
        return (
          <Wrapper>
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
              >
                <MapPin className="h-3.5 w-3.5" />
                Destination
              </button>
              <button
                type="button"
                className="flex-1 rounded-md px-3 py-2 transition-all duration-300 flex items-center justify-center gap-1.5 text-sm"
                style={{ color: style.textColor }}
              >
                <Clock className="h-3.5 w-3.5" />
                Hourly
              </button>
            </div>
          </Wrapper>
        );

      case "trip-type":
        return (
          <Wrapper>
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
              >
                <ArrowRight className="h-3.5 w-3.5" />
                One Way
              </button>
              <button
                type="button"
                className="flex-1 rounded-md px-3 py-2 transition-all duration-300 flex items-center justify-center gap-1.5 text-sm"
                style={{ color: style.textColor }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Round Trip
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
                    placeholder="Stop 1 location"
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
                  + Add a stop
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
                placeholder="Duration (hours)"
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
                placeholder="Passengers"
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
                placeholder={field.placeholder || field.label}
                className={inputBaseClass}
                style={inputStyle}
                readOnly
              />
            </div>
          </Wrapper>
        );
    }
  };

  // Separate fields for the embed-style vertical layout
  // Grid fields: date+time pairs shown side-by-side
  const gridPairs = new Set(["date", "time", "return-date", "return-time"]);

  return (
    <SortableContext
      items={enabledFields.map((f) => `preview-${f.id}`)}
      strategy={rectSortingStrategy}
    >
      {/* Steps Preview */}
      {style.showSteps && (
        <div className="flex justify-between items-center px-4 py-3 mb-2">
          {[
            { Icon: MapPin, label: "Trip" },
            { Icon: Car, label: "Vehicle" },
            { Icon: CheckCircle, label: "Payment" },
          ].map(({ Icon, label }, index) => (
            <div
              key={index}
              className="flex flex-1 flex-col items-center relative"
            >
              {index < 2 && (
                <div className="absolute top-3 left-1/2 w-full h-0.5 bg-slate-200 -z-10" />
              )}
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  index === 0
                    ? "text-white shadow-sm"
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
                <Icon className="h-3 w-3" />
              </div>
              <span
                className={`mt-1 text-[10px] font-medium ${
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

      <div
        className="p-4 sm:p-6 transition-all duration-300"
        style={containerStyle}
      >
        {/* Header */}
        {style.showHeader && style.headingText && (
          <header className="mb-3 text-center">
            <h2
              className="text-base sm:text-lg font-bold"
              style={{
                color: style.headingColor,
                textAlign: style.headingAlignment,
              }}
            >
              {style.headingText}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: style.textColor }}>
              {style.subHeadingText || "Book your ride in seconds"}
            </p>
          </header>
        )}

        {/* Fields */}
        <div 
          className="grid gap-4 items-end" 
          style={{ gridTemplateColumns: `repeat(${style.columns || 2}, minmax(0, 1fr))` }}
        >
          {enabledFields.map((field) => renderField(field))}

          {/* Submit Button In Grid */}
          <div
             style={{
                gridColumn: style.buttonWidth === 'full' 
                  ? '1 / -1' 
                  : style.buttonWidth === 'half' 
                    ? `span ${Math.max(1, Math.floor((style.columns || 2)/2))}` 
                    : 'span 1',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: (style.buttonAlignment === 'left' ? 'flex-start' : style.buttonAlignment === 'right' ? 'flex-end' : 'center')
             }}
          >
             <button
                type="button"
                className="rounded-lg py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2"
                style={{
                  width: '100%',
                  backgroundColor: style.buttonColor || style.primaryColor,
                  color: style.buttonTextColor || '#ffffff',
                }}
             >
                <div className="flex items-center justify-center gap-2">
                   <span>{style.buttonText || "Search"}</span>
                   <ArrowRight className="h-4 w-4" />
                </div>
             </button>
          </div>
        </div>

        {/* Footer */}
        {style.showFooter && style.footerText && (
          <div
            className="mt-4 text-center text-xs opacity-80 px-2"
            style={{ color: style.textColor }}
          >
            {style.footerText}
          </div>
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
                  width={30}
                  height={20}
                  className="h-5 w-auto"
                />
              ),
            )}
          </div>
        )}
      </div>
    </SortableContext>
  );
}

// ─── Layout Manager Dialog ──────────────────────────────────────────────────
function LayoutManager({
  layouts,
  currentId,
  onSelect,
  onDuplicate,
  onDelete,
  onSetDefault,
  onCreateNew,
  isLoading,
}: {
  layouts: IFormLayout[];
  currentId: string | null;
  onSelect: (layout: IFormLayout) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onCreateNew: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {layouts.length} layout(s)
        </p>
        <Button size="sm" onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>
      {layouts.length === 0 ? (
        <div className="text-center py-8">
          <div className="rounded-full bg-muted p-4 mx-auto w-fit mb-3">
            <LayoutTemplate className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No layouts created yet
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {layouts.map((layout) => (
            <div
              key={layout._id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
                currentId === layout._id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
              onClick={() => onSelect(layout)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{layout.name}</p>
                  {layout.isDefault && (
                    <Badge className="text-[10px] px-1.5 py-0 h-4">
                      Default
                    </Badge>
                  )}
                  {!layout.isActive && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground"
                    >
                      Inactive
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {layout.fields.filter((f) => f.enabled).length} /{" "}
                  {layout.fields.length} field(s) enabled
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!layout.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetDefault(layout._id!);
                    }}
                    className="p-1.5 rounded hover:bg-muted"
                    title="Set as default"
                  >
                    <Star className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(layout._id!);
                  }}
                  className="p-1.5 rounded hover:bg-muted"
                  title="Duplicate"
                  disabled={isLoading}
                >
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this layout?")) onDelete(layout._id!);
                  }}
                  className="p-1.5 rounded hover:bg-destructive/10"
                  title="Delete"
                  disabled={isLoading}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function FormBuilderPage() {
  const [layouts, setLayouts] = useState<IFormLayout[]>([]);
  const [currentLayout, setCurrentLayout] = useState<IFormLayout | null>(null);
  const [fields, setFields] = useState<IFormField[]>(createDefaultFields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState("Default Booking Form");
  const [layoutDescription, setLayoutDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showManager, setShowManager] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [undoStack, setUndoStack] = useState<IFormField[][]>([]);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formStyle, setFormStyle] = useState<IFormStyle>(DEFAULT_STYLE);
  const isSavingRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  // ── Fetch layouts ──
  const fetchLayouts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiGet<{ success: boolean; data: IFormLayout[] }>(
        "/api/form-layouts",
      );
      if (data.success) {
        setLayouts(data.data);
      }
    } catch (error) {
      console.error("Error fetching layouts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLayouts();
  }, [fetchLayouts]);

  // ── Draft recovery from localStorage ──
  useEffect(() => {
    // Only load draft if no layout is selected
    if (currentLayout) return;

    const draft = localStorage.getItem("formBuilderDraft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.fields?.length >= 0) {
          setFields(parsed.fields);
          setLayoutName(parsed.name || "Default Booking Form");
          setLayoutDescription(parsed.description || "");
          if (parsed.style) setFormStyle(parsed.style);

          // If the draft had an ID, try to find and set the current layout
          if (parsed.currentLayoutId && layouts.length > 0) {
            const match = layouts.find((l) => l._id === parsed.currentLayoutId);
            if (match) {
              setCurrentLayout(match);
            }
          }
        }
      } catch {
        /* ignore */
      }
    }
  }, [currentLayout, layouts.length]);

  // ── Save draft to localStorage ──
  useEffect(() => {
    if (fields.length > 0 || layoutName || currentLayout?._id) {
      localStorage.setItem(
        "formBuilderDraft",
        JSON.stringify({
          fields,
          name: layoutName,
          description: layoutDescription,
          style: formStyle,
          currentLayoutId: currentLayout?._id,
        }),
      );
    }
  }, [fields, layoutName, layoutDescription, formStyle, currentLayout?._id]);

  // ── Auto-save ──
  useEffect(() => {
    if (!currentLayout?._id || fields.length === 0) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await apiPatch(`/api/form-layouts/${currentLayout._id}`, {
          fields,
          style: formStyle,
          name: layoutName,
          description: layoutDescription,
        });
        setLastSaved(new Date());
      } catch {
        /* silent fail */
      }
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [fields, layoutName, layoutDescription, currentLayout, formStyle]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && undoStack.length > 0) {
        e.preventDefault();
        const prev = undoStack[undoStack.length - 1];
        setUndoStack((s) => s.slice(0, -1));
        setFields(prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undoStack]);

  // ── Undo helpers ──
  const pushUndo = () => {
    setUndoStack((prev) => [...prev.slice(-20), [...fields]]);
  };

  // ── Add/Remove Fields ──
  const addField = (type: BookingFieldType) => {
    if (fields.some((f) => f.type === type)) {
      return;
    }
    const reg = FIELD_REGISTRY[type];
    pushUndo();
    const newField: IFormField = {
      id: `field_${type}_${Date.now()}`,
      type,
      label: reg.label,
      placeholder: reg.placeholder || "",
      required: reg.required,
      enabled: true,
      width: reg.width,
      order: fields.length,
      step: 1,
      visibleWhen: reg.visibleWhen,
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    pushUndo();
    setFields(fields.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  // ── Toggle field enabled/disabled ──
  const toggleField = (id: string) => {
    const field = fields.find((f) => f.id === id);
    if (!field) return;

    const reg = FIELD_REGISTRY[field.type];
    if (reg?.locked) return;

    pushUndo();
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
    );
  };

  // ── Update field ──
  const updateField = (id: string, updates: Partial<IFormField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  // ── DnD handlers ──
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    pushUndo();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((items) => {
        const activeId = String(active.id).replace("preview-", "");
        const overId = String(over.id).replace("preview-", "");

        const oldIndex = items.findIndex((i) => i.id === activeId);
        const newIndex = items.findIndex((i) => i.id === overId);

        if (oldIndex === -1 || newIndex === -1) return items;

        return arrayMove(items, oldIndex, newIndex).map((f, i) => ({
          ...f,
          order: i,
        }));
      });
    }
  };

  // ── Save layout ──
  const saveLayout = async () => {
    if (isSavingRef.current) return;

    if (!layoutName.trim()) {
      alert("Please enter a layout name");
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const payload = {
        name: layoutName,
        description: layoutDescription,
        fields: fields.map((f, i) => ({ ...f, order: i })),
        style: formStyle,
        isActive: true,
        isDefault: currentLayout?.isDefault ?? false,
      };

      if (currentLayout?._id) {
        const data = await apiPatch<{
          success: boolean;
          data: IFormLayout;
          message: string;
        }>(`/api/form-layouts/${currentLayout._id}`, payload);
        if (data.success) {
          setCurrentLayout(data.data);
          setLastSaved(new Date());
          await fetchLayouts();
        }
      } else {
        const data = await apiPost<{
          success: boolean;
          data: IFormLayout;
          message: string;
        }>("/api/form-layouts", payload);
        if (data.success) {
          setCurrentLayout(data.data);
          setLastSaved(new Date());
          localStorage.removeItem("formBuilderDraft");
          await fetchLayouts();
        }
      }
    } catch (error) {
      console.error("Error saving layout:", error);
      alert("Failed to save layout");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  // ── Layout manager actions ──
  const selectLayout = (layout: IFormLayout) => {
    setCurrentLayout(layout);
    setFields(layout.fields);
    setFormStyle(layout.style || DEFAULT_STYLE);
    setLayoutName(layout.name);
    setLayoutDescription(layout.description || "");
    setSelectedFieldId(null);
    setUndoStack([]);
    setShowManager(false);
  };

  const createNew = () => {
    setCurrentLayout(null);
    setFields(createDefaultFields());
    setFormStyle(DEFAULT_STYLE);
    setLayoutName("Default Booking Form");
    setLayoutDescription("");
    setSelectedFieldId(null);
    setUndoStack([]);
    setShowManager(false);
    localStorage.removeItem("formBuilderDraft");
  };

  const duplicateLayout = async (id: string) => {
    try {
      const data = await apiPost<{ success: boolean; data: IFormLayout }>(
        `/api/form-layouts/${id}/duplicate`,
        {},
      );
      if (data.success) {
        await fetchLayouts();
      }
    } catch (error) {
      console.error("Error duplicating layout:", error);
    }
  };

  const deleteLayout = async (id: string) => {
    try {
      await apiDelete<{ success: boolean }>(`/api/form-layouts/${id}`);
      if (currentLayout?._id === id) createNew();
      await fetchLayouts();
    } catch (error) {
      console.error("Error deleting layout:", error);
    }
  };

  const setDefaultLayout = async (id: string) => {
    try {
      await apiPatch(`/api/form-layouts/${id}`, { isDefault: true });
      await fetchLayouts();
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  const resetToDefaults = () => {
    pushUndo();
    setFields(createDefaultFields());
    setFormStyle(DEFAULT_STYLE);
    localStorage.removeItem("formBuilderDraft");
  };

  const draggedField = activeId
    ? fields.find((f) => f.id === String(activeId).replace("preview-", ""))
    : null;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder="Layout name"
                  className="text-2xl font-bold h-auto py-1 px-2 w-64"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingName(false);
                    if (e.key === "Escape") setEditingName(false);
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingName(false)}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <h1
                className="text-2xl sm:text-3xl font-bold text-foreground cursor-pointer hover:text-primary/80 transition-colors flex items-center gap-2 group"
                onClick={() => setEditingName(true)}
              >
                {layoutName || "Untitled Layout"}
                <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>
            )}
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground text-sm">
                {fields.filter((f) => f.enabled).length} / {fields.length}{" "}
                fields enabled
              </p>
              {lastSaved && (
                <span className="text-xs text-muted-foreground">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            Reset
          </Button>
          <Dialog open={showManager} onOpenChange={setShowManager}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <LayoutTemplate className="h-4 w-4 mr-2" />
                Layouts
                {layouts.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs h-5">
                    {layouts.length}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Layout Manager</DialogTitle>
              </DialogHeader>
              <LayoutManager
                layouts={layouts}
                currentId={currentLayout?._id ?? null}
                onSelect={selectLayout}
                onDuplicate={duplicateLayout}
                onDelete={deleteLayout}
                onSetDefault={setDefaultLayout}
                onCreateNew={createNew}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
          <Button
            onClick={saveLayout}
            disabled={isSaving || !layoutName.trim()}
            size="sm"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* ── Main Builder Area ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Canvas (Fields List) ── */}
          <div className="lg:col-span-4">
            <Card className="border border-border bg-card overflow-hidden sticky top-6">
              <CardHeader className="p-0">
                <div className="px-4 pt-4 pb-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardTitle className="text-base">Form Elements</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Click to add • Drag to reorder
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-3 max-h-[calc(100vh-220px)] overflow-y-auto space-y-5">
                {/* Available Fields */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                    Available Fields
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(FIELD_REGISTRY) as BookingFieldType[])
                      .filter((type) => !fields.some((f) => f.type === type))
                      .map((type) => {
                        const reg = FIELD_REGISTRY[type];
                        const Icon = reg.icon;
                        const isImportant = ["pickup", "dropoff", "date", "time"].includes(type) || 
                                          (type === "duration" && fields.some(f => f.type === "booking-type")) ||
                                          ((type === "return-date" || type === "return-time") && fields.some(f => f.type === "trip-type"));
                        
                        return (
                          <Button
                            key={type}
                            variant="outline"
                            size="sm"
                            className={`justify-start gap-2 h-9 px-2 text-[11px] transition-all group ${
                              isImportant 
                                ? "border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-50" 
                                : "hover:border-primary/50 hover:bg-primary/5"
                            }`}
                            onClick={() => addField(type)}
                          >
                            <div className="relative">
                              <Icon className={`h-3.5 w-3.5 shrink-0 group-hover:scale-110 transition-transform ${isImportant ? "text-amber-600" : "text-primary"}`} />
                            </div>
                            <span className={`truncate ${isImportant ? "font-semibold text-amber-900" : ""}`}>
                              {reg.label}
                              {isImportant && <span className="ml-0.5 text-amber-600 font-bold">*</span>}
                            </span>
                          </Button>
                        );
                      })}
                  </div>
                  {(Object.keys(FIELD_REGISTRY) as BookingFieldType[]).filter(
                    (type) => !fields.some((f) => f.type === type),
                  ).length === 0 && (
                    <div className="text-[10px] text-muted-foreground text-center py-2 px-3 border border-dashed rounded-md bg-muted/20">
                      All available elements added
                    </div>
                  )}
                </div>

                <Separator />

                {/* Form Structure */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                    Active Form Layout
                  </Label>
                  {fields.length === 0 ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg bg-muted/10">
                      <Plus className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground font-medium">
                        Your form is empty
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        Select elements above to start building your custom form
                      </p>
                    </div>
                  ) : (
                    <SortableContext
                      items={fields.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-1.5">
                        {fields.map((field) => (
                          <SortableField
                            key={field.id}
                            field={field}
                            isSelected={selectedFieldId === field.id}
                            onSelect={() => setSelectedFieldId(field.id)}
                            onToggle={() => toggleField(field.id)}
                            onRemove={() => removeField(field.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Preview Panel ── */}
          <div className="lg:col-span-5">
            <Card className="border border-border bg-card overflow-hidden">
              <CardHeader className="p-0">
                <div className="px-4 pt-4 pb-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10 flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Preview</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Live booking form preview
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                    <button
                      onClick={() => setPreviewMode("desktop")}
                      className={`p-1.5 rounded transition-all ${
                        previewMode === "desktop"
                          ? "bg-card shadow-sm"
                          : "hover:bg-card/50"
                      }`}
                    >
                      <Monitor className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPreviewMode("mobile")}
                      className={`p-1.5 rounded transition-all ${
                        previewMode === "mobile"
                          ? "bg-card shadow-sm"
                          : "hover:bg-card/50"
                      }`}
                    >
                      <Smartphone className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-[radial-gradient(circle,#e5e7eb_1px,transparent_1px)] bg-[size:16px_16px]">
                <div
                  className={`mx-auto transition-all ${
                    previewMode === "mobile" ? "max-w-[320px]" : "max-w-full"
                  }`}
                >
                  <FormPreview
                    fields={fields}
                    previewMode={previewMode}
                    style={formStyle}
                    onSelectField={(id) => setSelectedFieldId(id)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Configuration Panel ── */}
          <div className="lg:col-span-3">
            <Card className="border border-border bg-card overflow-hidden sticky top-6">
              <Tabs defaultValue="properties" className="w-full">
                <CardHeader className="p-0">
                  <div className="px-4 pt-4 pb-0 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
                    <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 pb-3 h-auto">
                      <TabsTrigger
                        value="properties"
                        className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md py-1.5 text-xs text-muted-foreground data-[state=active]:text-foreground"
                      >
                        Field Properties
                      </TabsTrigger>
                      <TabsTrigger
                        value="design"
                        className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md py-1.5 text-xs text-muted-foreground data-[state=active]:text-foreground"
                      >
                        Form Design
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <TabsContent value="properties" className="mt-0">
                    {selectedField ? (
                      <div className="space-y-4">
                        {/* Field type badge */}
                        <div className="flex items-center gap-2">
                          {(() => {
                            const reg = FIELD_REGISTRY[selectedField.type];
                            const Icon = reg?.icon || MapPin;
                            return (
                              <>
                                <div className="rounded-md bg-primary/10 p-2">
                                  <Icon className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {selectedField.type}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {reg?.description}
                                  </p>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        <Separator />

                        {/* Label */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Label</Label>
                          <Input
                            value={selectedField.label}
                            onChange={(e) =>
                              updateField(selectedField.id, {
                                label: e.target.value,
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>

                        {/* Placeholder */}
                        {!["booking-type", "trip-type", "stops"].includes(
                          selectedField.type,
                        ) && (
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">
                              Placeholder
                            </Label>
                            <Input
                              value={selectedField.placeholder || ""}
                              onChange={(e) =>
                                updateField(selectedField.id, {
                                  placeholder: e.target.value,
                                })
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                        )}

                        {/* Width */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Width</Label>
                          <Select
                            value={selectedField.width}
                            onValueChange={(v) =>
                              updateField(selectedField.id, {
                                width: v as IFormField["width"],
                              })
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full">Full Width</SelectItem>
                              <SelectItem value="half">Half Width</SelectItem>
                              <SelectItem value="third">Third Width</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Required toggle */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-xs font-medium">
                              Required
                            </Label>
                            {FIELD_REGISTRY[selectedField.type]?.locked && (
                              <p className="text-[10px] text-muted-foreground">
                                Core field — always required
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              if (FIELD_REGISTRY[selectedField.type]?.locked)
                                return;
                              updateField(selectedField.id, {
                                required: !selectedField.required,
                              });
                            }}
                            disabled={
                              FIELD_REGISTRY[selectedField.type]?.locked
                            }
                            className={`relative h-5 w-9 rounded-full transition-colors ${
                              selectedField.required
                                ? "bg-primary"
                                : "bg-muted-foreground/30"
                            } ${
                              FIELD_REGISTRY[selectedField.type]?.locked
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                selectedField.required
                                  ? "translate-x-4"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Enabled toggle */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-xs font-medium">
                              Enabled
                            </Label>
                            {FIELD_REGISTRY[selectedField.type]?.locked && (
                              <p className="text-[10px] text-muted-foreground">
                                Cannot be disabled
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => toggleField(selectedField.id)}
                            disabled={
                              FIELD_REGISTRY[selectedField.type]?.locked
                            }
                            className={`relative h-5 w-9 rounded-full transition-colors ${
                              selectedField.enabled
                                ? "bg-primary"
                                : "bg-muted-foreground/30"
                            } ${
                              FIELD_REGISTRY[selectedField.type]?.locked
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                selectedField.enabled
                                  ? "translate-x-4"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Visibility conditions */}
                        {selectedField.visibleWhen &&
                          (selectedField.visibleWhen.bookingType ||
                            selectedField.visibleWhen.tripType) && (
                            <>
                              <Separator />
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Visibility
                                </p>
                                {selectedField.visibleWhen.bookingType && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
                                    <Eye className="h-3 w-3" />
                                    <span>
                                      Only visible when booking type ={" "}
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 h-4 ml-0.5"
                                      >
                                        {selectedField.visibleWhen.bookingType}
                                      </Badge>
                                    </span>
                                  </div>
                                )}
                                {selectedField.visibleWhen.tripType && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
                                    <Eye className="h-3 w-3" />
                                    <span>
                                      Only visible when trip type ={" "}
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 h-4 ml-0.5"
                                      >
                                        round-trip
                                      </Badge>
                                    </span>
                                  </div>
                                )}
                              </div>
                            </>
                          )}

                        <Separator />

                        {/* Step info - Removed for single step layout */}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="rounded-full bg-muted p-3 mb-3">
                          <Settings2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Select a field to configure
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Click on any field in the canvas
                        </p>
                        <div className="mt-4 space-y-1 text-xs text-muted-foreground/60">
                          <p>
                            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                              Ctrl+Z
                            </kbd>{" "}
                            Undo
                          </p>
                          <p>
                            <Lock className="inline h-3 w-3 mr-1" />
                            Locked fields cannot be disabled
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent
                    value="design"
                    className="mt-0 space-y-5 h-[calc(100vh-270px)] overflow-y-auto pr-2"
                  >
                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Progress Steps
                      </Label>
                      <Switch
                        checked={formStyle.showSteps}
                        onCheckedChange={(c) =>
                          setFormStyle((s) => ({ ...s, showSteps: c }))
                        }
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Header
                        </Label>
                        <Switch
                          checked={formStyle.showHeader}
                          onCheckedChange={(c) =>
                            setFormStyle((s) => ({ ...s, showHeader: c }))
                          }
                        />
                      </div>
                      {formStyle.showHeader && (
                        <div className="space-y-2 pl-2 border-l-2 border-muted ml-1">
                          <div className="space-y-1">
                            <Label className="text-[10px]">Title</Label>
                            <Input
                              value={formStyle.headingText}
                              onChange={(e) =>
                                setFormStyle((s) => ({
                                  ...s,
                                  headingText: e.target.value,
                                }))
                              }
                              className="h-7 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Sub-heading</Label>
                            <Input
                              value={formStyle.subHeadingText}
                              onChange={(e) =>
                                setFormStyle((s) => ({
                                  ...s,
                                  subHeadingText: e.target.value,
                                }))
                              }
                              className="h-7 text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[10px]">Alignment</Label>
                              <Select
                                value={formStyle.headingAlignment}
                                onValueChange={(v) =>
                                  setFormStyle((s) => ({
                                    ...s,
                                    headingAlignment: v as any,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="left">Left</SelectItem>
                                  <SelectItem value="center">Center</SelectItem>
                                  <SelectItem value="right">Right</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-[10px]">Color</Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={formStyle.headingColor}
                                  onChange={(e) =>
                                    setFormStyle((s) => ({
                                      ...s,
                                      headingColor: e.target.value,
                                    }))
                                  }
                                  className="h-7 w-7 rounded cursor-pointer border-0 p-0"
                                />
                                <span className="text-[10px] font-mono">
                                  {formStyle.headingColor}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Submit Button Styles */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Search Button
                      </Label>

                       <div className="space-y-1">
                          <Label className="text-[10px]">Button Text</Label>
                          <Input
                            value={formStyle.buttonText}
                            onChange={(e) =>
                              setFormStyle((s) => ({
                                ...s,
                                buttonText: e.target.value,
                              }))
                            }
                            className="h-7 text-xs"
                          />
                        </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Button Color</Label>
                          <div className="flex items-center gap-2">
                            <div className="relative h-7 w-7 rounded border overflow-hidden">
                              <input
                                type="color"
                                className="absolute -top-1 -left-1 w-10 h-10 border-0 p-0 cursor-pointer"
                                value={formStyle.buttonColor || "#0f172a"}
                                onChange={(e) =>
                                  setFormStyle((s) => ({
                                    ...s,
                                    buttonColor: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <Input
                              className="h-7 text-xs font-mono p-1"
                              value={formStyle.buttonColor || "#0f172a"}
                              onChange={(e) =>
                                setFormStyle((s) => ({
                                  ...s,
                                  buttonColor: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Text Color</Label>
                          <div className="flex items-center gap-2">
                            <div className="relative h-7 w-7 rounded border overflow-hidden">
                              <input
                                type="color"
                                className="absolute -top-1 -left-1 w-10 h-10 border-0 p-0 cursor-pointer"
                                value={formStyle.buttonTextColor || "#ffffff"}
                                onChange={(e) =>
                                  setFormStyle((s) => ({
                                    ...s,
                                    buttonTextColor: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <Input
                              className="h-7 text-xs font-mono p-1"
                              value={formStyle.buttonTextColor || "#ffffff"}
                              onChange={(e) =>
                                setFormStyle((s) => ({
                                  ...s,
                                  buttonTextColor: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Width</Label>
                          <Select
                              value={formStyle.buttonWidth || "full"}
                              onValueChange={(v) =>
                                setFormStyle((s) => ({
                                  ...s,
                                  buttonWidth: v as any,
                                }))
                              }
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full">Full Width</SelectItem>
                                <SelectItem value="auto">Auto</SelectItem>
                                <SelectItem value="half">Half</SelectItem>
                              </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Alignment</Label>
                          <Select
                              value={formStyle.buttonAlignment || "center"}
                              onValueChange={(v) =>
                                setFormStyle((s) => ({
                                  ...s,
                                  buttonAlignment: v as any,
                                }))
                              }
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                              </SelectContent>
                            </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Main Styles */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Appearance
                      </Label>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px]">Grid Columns</Label>
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                            {formStyle.columns || 2}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="4"
                          step="1"
                          value={formStyle.columns || 2}
                          onChange={(e) =>
                            setFormStyle((s) => ({
                              ...s,
                              columns: parseInt(e.target.value),
                            }))
                          }
                          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[8px] text-muted-foreground px-1">
                          <span>1</span>
                          <span>2</span>
                          <span>3</span>
                          <span>4</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Background</Label>
                          <div className="flex items-center gap-2">
                            <div className="relative h-7 w-7 rounded border overflow-hidden">
                              <input
                                type="color"
                                className="absolute -top-1 -left-1 w-10 h-10 border-0 p-0 cursor-pointer"
                                value={formStyle.backgroundColor}
                                onChange={(e) =>
                                  setFormStyle((s) => ({
                                    ...s,
                                    backgroundColor: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <Input
                              className="h-7 text-xs font-mono p-1"
                              value={formStyle.backgroundColor}
                              onChange={(e) =>
                                setFormStyle((s) => ({
                                  ...s,
                                  backgroundColor: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">
                            Opacity: {formStyle.backgroundOpacity}%
                          </Label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={formStyle.backgroundOpacity}
                            onChange={(e) =>
                              setFormStyle((s) => ({
                                ...s,
                                backgroundOpacity: parseInt(e.target.value),
                              }))
                            }
                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Label className="text-[10px]">Glass Effect</Label>
                        <Switch
                          checked={formStyle.glassEffect}
                          onCheckedChange={(c) =>
                            setFormStyle((s) => ({ ...s, glassEffect: c }))
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Primary Color</Label>
                          <div className="flex items-center gap-2">
                            <div className="relative h-7 w-7 rounded border overflow-hidden">
                              <input
                                type="color"
                                className="absolute -top-1 -left-1 w-10 h-10 border-0 p-0 cursor-pointer"
                                value={formStyle.primaryColor}
                                onChange={(e) =>
                                  setFormStyle((s) => ({
                                    ...s,
                                    primaryColor: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <Input
                              className="h-7 text-xs font-mono p-1"
                              value={formStyle.primaryColor}
                              onChange={(e) =>
                                setFormStyle((s) => ({
                                  ...s,
                                  primaryColor: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Text Color</Label>
                          <div className="flex items-center gap-2">
                            <div className="relative h-7 w-7 rounded border overflow-hidden">
                              <input
                                type="color"
                                className="absolute -top-1 -left-1 w-10 h-10 border-0 p-0 cursor-pointer"
                                value={formStyle.textColor}
                                onChange={(e) =>
                                  setFormStyle((s) => ({
                                    ...s,
                                    textColor: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <Input
                              className="h-7 text-xs font-mono p-1"
                              value={formStyle.textColor}
                              onChange={(e) =>
                                setFormStyle((s) => ({
                                  ...s,
                                  textColor: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Borders */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Container Border
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Radius</Label>
                          <Select
                            value={formStyle.borderRadius}
                            onValueChange={(v) =>
                              setFormStyle((s) => ({ ...s, borderRadius: v }))
                            }
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0rem">0px</SelectItem>
                              <SelectItem value="0.25rem">4px</SelectItem>
                              <SelectItem value="0.5rem">8px</SelectItem>
                              <SelectItem value="0.75rem">12px</SelectItem>
                              <SelectItem value="1rem">16px</SelectItem>
                              <SelectItem value="1.5rem">24px</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Width</Label>
                          <Select
                            value={formStyle.borderWidth}
                            onValueChange={(v) =>
                              setFormStyle((s) => ({ ...s, borderWidth: v }))
                            }
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0px">None</SelectItem>
                              <SelectItem value="1px">Thin</SelectItem>
                              <SelectItem value="2px">Medium</SelectItem>
                              <SelectItem value="4px">Thick</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[10px]">Border Color</Label>
                          <div className="flex items-center gap-2 text-xs">
                            <input
                              type="color"
                              value={formStyle.borderColor}
                              onChange={(e) =>
                                setFormStyle((s) => ({
                                  ...s,
                                  borderColor: e.target.value,
                                }))
                              }
                              className="h-6 w-12 rounded cursor-pointer"
                            />
                            <span className="font-mono">
                              {formStyle.borderColor}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Inputs */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Input Fields
                      </Label>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 items-center">
                          <Label className="text-[10px]">Background</Label>
                          <div className="flex justify-end">
                            <input
                              type="color"
                              value={formStyle.inputBackgroundColor}
                              onChange={(e) =>
                                setFormStyle((s) => ({
                                  ...s,
                                  inputBackgroundColor: e.target.value,
                                }))
                              }
                              className="h-6 w-8 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 items-center">
                          <Label className="text-[10px]">Text Color</Label>
                          <div className="flex justify-end">
                            <input
                              type="color"
                              value={formStyle.inputTextColor}
                              onChange={(e) =>
                                setFormStyle((s) => ({
                                  ...s,
                                  inputTextColor: e.target.value,
                                }))
                              }
                              className="h-6 w-8 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 items-center">
                          <Label className="text-[10px]">Border Color</Label>
                          <div className="flex justify-end">
                            <input
                              type="color"
                              value={formStyle.inputBorderColor}
                              onChange={(e) =>
                                setFormStyle((s) => ({
                                  ...s,
                                  inputBorderColor: e.target.value,
                                }))
                              }
                              className="h-6 w-8 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 items-center">
                          <Label className="text-[10px]">Label Color</Label>
                          <div className="flex justify-end">
                            <input
                              type="color"
                              value={formStyle.labelColor}
                              onChange={(e) =>
                                setFormStyle((s) => ({
                                  ...s,
                                  labelColor: e.target.value,
                                }))
                              }
                              className="h-6 w-8 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Footer */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Footer
                        </Label>
                        <Switch
                          checked={formStyle.showFooter}
                          onCheckedChange={(c) =>
                            setFormStyle((s) => ({ ...s, showFooter: c }))
                          }
                        />
                      </div>
                      {formStyle.showFooter && (
                        <div className="pl-2 border-l-2 border-muted ml-1 pt-1">
                          <Label className="text-[10px] mb-1.5 block">
                            Footer Text
                          </Label>
                          <Input
                            value={formStyle.footerText}
                            onChange={(e) =>
                              setFormStyle((s) => ({
                                ...s,
                                footerText: e.target.value,
                              }))
                            }
                            className="h-7 text-xs"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Footer Images
                        </Label>
                        <Switch
                          checked={formStyle.showFooterImages}
                          onCheckedChange={(c) =>
                            setFormStyle((s) => ({ ...s, showFooterImages: c }))
                          }
                        />
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
        <DragOverlay>
          {draggedField ? <FieldPreview field={draggedField} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
