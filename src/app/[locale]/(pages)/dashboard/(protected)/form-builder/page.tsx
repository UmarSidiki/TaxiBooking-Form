// FormBuilderPage.tsx - Updated with Auto-Mobile Detection
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
  Grid3X3,
  Columns,
  Move,
  Layers,
  Type,
  Palette,
  CornerDownRight
} from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  IFormLayout,
  IFormField,
  BookingFieldType,
  IFormStyle,
} from "@/models/form-layout";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/utils/api";
import { useMediaQuery } from "@/hooks/useMediaQuery"; // Import the new hook
import React from "react";

// ... (FIELD_REGISTRY and DEFAULT_STYLE remain the same as previous answer) ...
const FIELD_REGISTRY: Record<
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

function createDefaultFields(): IFormField[] {
  return [];
}

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

// ... (SortableField, FieldPreview, GridBackground, SortablePreviewItem remain same) ...
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
  const t = useTranslations("FormBuilder");
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
              ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
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
          <p className="text-xs font-medium truncate">{field.label || (reg ? t(reg.labelKey) : "")}</p>
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
              {t("ui.round_trip")}
            </Badge>
          )}
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
            {field.width === "full"
              ? t("full")
              : field.width === "two-thirds"
                ? "⅔"
                : field.width === "half"
                  ? "½"
                  : field.width === "third"
                    ? "⅓"
                    : "¼"}
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
          title={field.enabled ? t("ui.hide_in_preview") : t("ui.show_in_preview")}
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
          title={t("ui.remove_from_form")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function FieldPreview({ field }: { field: IFormField }) {
  const t = useTranslations("FormBuilder");
  const reg = FIELD_REGISTRY[field.type];
  const Icon = reg?.icon || MapPin;

  return (
    <div className="flex items-center gap-3 rounded-lg border-2 border-primary bg-card p-3 shadow-xl rotate-2 scale-105">
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <div className="rounded-md bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-sm font-medium">{field.label || (reg ? t(reg.labelKey) : "")}</p>
    </div>
  );
}

function GridBackground({ columns, gap }: { columns: number; gap: number }) {
  return (
    <div 
      className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
      style={{
        backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px)`,
        backgroundSize: `${100 / columns}% 100%`,
        marginRight: `-${gap}px`
      }}
    />
  );
}

function SortablePreviewItem({
  id,
  className,
  children,
  style: styleProp,
  onClick,
  isMobile,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  isMobile?: boolean;
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
      className={`group relative ${className || ""} ${isDragging ? 'ring-2 ring-primary' : ''}`}
      onClick={(e) => {
         if(!isDragging && onClick) onClick(e);
      }}
    >
      <div className="absolute -inset-[2px] border-2 border-transparent group-hover:border-primary/30 rounded-lg pointer-events-none transition-colors z-10" />
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1.5 cursor-grab opacity-0 group-hover:opacity-100 bg-background/90 hover:bg-primary hover:text-white border shadow-sm rounded-md z-20 transition-all"
        title="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>
      {children}
    </div>
  );
}

// ... (FormPreview, LayoutManager remain largely same, but FormPreview uses previewMode from props) ...
function FormPreview({
  fields,
  style,
  onSelectField,
  previewMode,
}: {
  fields: IFormField[];
  previewMode: "desktop" | "mobile";
  style: IFormStyle;
  onSelectField?: (id: string) => void;
}) {
  const t = useTranslations("FormBuilder");
  const enabledFields = fields.filter((f) => f.enabled);
  const [previewBookingType, setPreviewBookingType] = useState<"destination" | "hourly">("destination");
  const [previewTripType, setPreviewTripType] = useState<"oneway" | "roundtrip">("oneway");

  const visibleFields = enabledFields.filter((field) => {
    if (field.visibleWhen?.bookingType && field.visibleWhen.bookingType !== previewBookingType) return false;
    if (field.visibleWhen?.tripType && field.visibleWhen.tripType !== previewTripType) return false;
    return true;
  });

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
        className="flex flex-col items-center justify-center py-16 text-center transition-all duration-300 relative overflow-hidden"
        style={containerStyle}
      >
        <GridBackground columns={style.columns || 2} gap={style.fieldGap || 12} />
        <div className="rounded-full bg-muted p-6 mb-4 relative z-10">
          <LayoutTemplate className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-base font-medium text-muted-foreground mb-1 relative z-10">
          {t("ui.no_fields_enabled")}
        </p>
        <p className="text-sm text-muted-foreground/70 relative z-10">
          {t("ui.enable_fields_to_see_preview")}
        </p>
      </div>
    );
  }

  const inputPadding = style.inputSize === "compact" ? "py-1.5" : style.inputSize === "large" ? "py-3.5" : "py-2.5";
  const inputText = style.inputSize === "compact" ? "text-xs" : style.inputSize === "large" ? "text-base" : "text-sm";
  const inputBaseClass =
    `w-full border pl-9 pr-3 ${inputPadding} ${inputText} transition-all duration-200 focus:outline-none focus:ring-2`;

  const renderField = (field: IFormField) => {
    const reg = FIELD_REGISTRY[field.type];
    const Icon = reg?.icon || MapPin;

    const inputStyle: React.CSSProperties = {
      backgroundColor: style.inputBackgroundColor,
      borderColor: style.inputBorderColor,
      color: style.inputTextColor,
      borderRadius: style.inputBorderRadius || "0.5rem",
    };

    const iconStyle: React.CSSProperties = { color: style.primaryColor };

    const Wrapper = ({ children }: { children: React.ReactNode }) => {
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
  };

  return (
    <SortableContext
      items={[...visibleFields.map((f) => `preview-${f.id}`), 'button-search']}
      strategy={rectSortingStrategy}
    >
      {style.showSteps && (
        <div className="flex justify-between items-center px-4 py-3 mb-2">
          {[
            { Icon: MapPin, label: t("ui.steps.trip") },
            { Icon: Car, label: t("ui.steps.vehicle") },
            { Icon: CheckCircle, label: t("ui.steps.payment") },
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
        className="p-4 sm:p-6 transition-all duration-300 relative overflow-hidden"
        style={containerStyle}
      >
        <GridBackground columns={style.columns || 2} gap={style.fieldGap || 12} />

        {style.showHeader && style.headingText && (
          <header className="mb-3 relative z-10">
            <h2
              className="text-base sm:text-lg font-bold"
              style={{
                color: style.headingColor,
                textAlign: style.headingAlignment,
              }}
            >
              {style.headingText}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: style.textColor, textAlign: style.subHeadingAlignment }}>
              {style.subHeadingText || t("ui.default_subheading")}
            </p>
          </header>
        )}

        <div 
          className="grid items-end relative z-10" 
          style={{ 
            gridTemplateColumns: `repeat(${style.columns || 2}, minmax(0, 1fr))`,
            gap: `${style.fieldGap ?? 12}px`,
            padding: "2px",
          }}
        >
          {visibleFields.map((field, fieldIndex) => (
            <React.Fragment key={field.id}>
              {/* Render button at its position if set */}
              {style.buttonPosition === fieldIndex && (
                <SortablePreviewItem
                  id="button-search"
                  className="cursor-pointer"
                  style={{
                    gridColumn: (() => {
                      const cols = style.columns || 2;
                      if (style.buttonWidth === 'full') return '1 / -1';
                      if (style.buttonWidth === 'two-thirds') return `span ${Math.round(cols * 2 / 3)}`;
                      if (style.buttonWidth === 'half') return `span ${Math.max(1, Math.ceil(cols / 2))}`;
                      if (style.buttonWidth === 'third') return `span ${Math.max(1, Math.ceil(cols / 3))}`;
                      if (style.buttonWidth === 'quarter') return `span ${Math.max(1, Math.ceil(cols / 4))}`;
                      return 'span 1';
                    })(),
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: (style.buttonAlignment === 'left' ? 'flex-start' : style.buttonAlignment === 'right' ? 'flex-end' : 'center'),
                    height: '100%'
                  }}
                  onClick={() => onSelectField?.('__button_search')}
                >
                   <button
                      type="button"
                      className={`font-semibold tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2 w-full ${
                        style.buttonSize === 'small' ? 'py-1.5 text-xs rounded' :
                        style.buttonSize === 'large' ? 'py-3.5 text-base rounded-lg' :
                        'py-2.5 text-sm rounded-lg'
                      }`}
                      style={{
                        backgroundColor: style.buttonColor || style.primaryColor,
                        color: style.buttonTextColor || '#ffffff',
                        borderRadius: style.buttonBorderRadius || '0.5rem',
                      }}
                   >
                      <div className="flex items-center justify-center gap-2">
                         <span>{style.buttonText || t("ui.search")}</span>
                         <ArrowRight className={style.buttonSize === 'small' ? 'h-3 w-3' : style.buttonSize === 'large' ? 'h-5 w-5' : 'h-4 w-4'} />
                      </div>
                   </button>
                </SortablePreviewItem>
              )}
              {renderField(field)}
            </React.Fragment>
          ))}

          {/* Render button at the end if buttonPosition is not set or is beyond field count */}
          {(style.buttonPosition === undefined || style.buttonPosition >= visibleFields.length) && (
            <SortablePreviewItem
              id="button-search"
              className="cursor-pointer"
              style={{
                gridColumn: (() => {
                  const cols = style.columns || 2;
                  if (style.buttonWidth === 'full') return '1 / -1';
                  if (style.buttonWidth === 'two-thirds') return `span ${Math.round(cols * 2 / 3)}`;
                  if (style.buttonWidth === 'half') return `span ${Math.max(1, Math.ceil(cols / 2))}`;
                  if (style.buttonWidth === 'third') return `span ${Math.max(1, Math.ceil(cols / 3))}`;
                  if (style.buttonWidth === 'quarter') return `span ${Math.max(1, Math.ceil(cols / 4))}`;
                  return 'span 1';
                })(),
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: (style.buttonAlignment === 'left' ? 'flex-start' : style.buttonAlignment === 'right' ? 'flex-end' : 'center'),
                height: '100%'
              }}
              onClick={() => onSelectField?.('__button_search')}
            >
               <button
                  type="button"
                  className={`font-semibold tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2 w-full ${
                    style.buttonSize === 'small' ? 'py-1.5 text-xs rounded' :
                    style.buttonSize === 'large' ? 'py-3.5 text-base rounded-lg' :
                    'py-2.5 text-sm rounded-lg'
                  }`}
                  style={{
                    backgroundColor: style.buttonColor || style.primaryColor,
                    color: style.buttonTextColor || '#ffffff',
                    borderRadius: style.buttonBorderRadius || '0.5rem',
                  }}
               >
                  <div className="flex items-center justify-center gap-2">
                     <span>{style.buttonText || t("ui.search")}</span>
                     <ArrowRight className={style.buttonSize === 'small' ? 'h-3 w-3' : style.buttonSize === 'large' ? 'h-5 w-5' : 'h-4 w-4'} />
                  </div>
               </button>
            </SortablePreviewItem>
          )}
        </div>

        {style.showFooter && style.footerText && (
          <div
            className="mt-4 text-xs opacity-80 px-2 relative z-10"
            style={{ color: style.textColor, textAlign: style.footerTextAlignment }}
          >
            {style.footerText}
          </div>
        )}

        {style.showFooterImages && (
          <div className="flex justify-center gap-2 flex-wrap pt-3 opacity-60 relative z-10">
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

function LayoutManager({ layouts, currentId, onSelect, onDuplicate, onDelete, onSetDefault, onCreateNew, isLoading }: any) {
  const t = useTranslations("FormBuilder");
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("ui.layouts_count", { count: layouts.length })}
        </p>
        <Button size="sm" onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-1" /> {t("ui.new")}
        </Button>
      </div>
      {layouts.length === 0 ? (
        <div className="text-center py-8">
          <div className="rounded-full bg-muted p-4 mx-auto w-fit mb-3">
            <LayoutTemplate className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("ui.no_layouts_created")}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {layouts.map((layout: any) => (
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
                      {t("ui.default")}
                    </Badge>
                  )}
                  {!layout.isActive && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground"
                    >
                      {t("ui.inactive")}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("ui.fields_enabled_count", {
                    enabled: layout.fields.filter((f: any) => f.enabled).length,
                    total: layout.fields.length
                  })}
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
                    title={t("ui.set_as_default")}
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
                  title={t("ui.duplicate")}
                  disabled={isLoading}
                >
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t("ui.confirm_delete_layout"))) onDelete(layout._id!);
                  }}
                  className="p-1.5 rounded hover:bg-destructive/10"
                  title={t("ui.delete")}
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
  const t = useTranslations("FormBuilder");
  const isTabletOrMobile = useMediaQuery("(max-width: 1024px)"); // Auto-switch breakpoint
  
  const [layouts, setLayouts] = useState<IFormLayout[]>([]);
  const [currentLayout, setCurrentLayout] = useState<IFormLayout | null>(null);
  const [fields, setFields] = useState<IFormField[]>(createDefaultFields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState("Default Booking Form");
  const [layoutDescription, setLayoutDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showManager, setShowManager] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [undoStack, setUndoStack] = useState<IFormField[][]>([]);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formStyle, setFormStyle] = useState<IFormStyle>(() => ({
    ...DEFAULT_STYLE,
    headingText: t("ui.default_heading"),
    subHeadingText: t("ui.default_subheading"),
    footerText: t("ui.default_footer"),
    buttonText: t("ui.search"),
  }));
  const isSavingRef = useRef(false);

  // Auto-switch preview mode based on screen size
  useEffect(() => {
    if (isTabletOrMobile) {
      setPreviewMode("mobile");
    } else {
      setPreviewMode("desktop");
    }
  }, [isTabletOrMobile]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  // ... (fetchLayouts, draft recovery, auto-save, keyboard shortcuts, undo helpers remain same) ...
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

  useEffect(() => {
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
        }
      } catch { /* ignore */ }
    }
  }, [currentLayout]);

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

  useEffect(() => {
    if (!currentLayout?._id || fields.length === 0) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const data = await apiPatch<{ success: boolean; data: IFormLayout }>(
          `/api/form-layouts/${currentLayout._id}`, 
          {
            fields: fields.map((f, i) => ({ ...f, order: i })),
            style: formStyle,
            name: layoutName,
            description: layoutDescription,
          }
        );
        if (data.success && data.data) {
          // Update currentLayout with fresh server data to prevent stale state
          setCurrentLayout(data.data);
          setLastSaved(new Date());
        }
      } catch { /* silent fail */ }
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [fields, layoutName, layoutDescription, currentLayout, formStyle]);

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

  const pushUndo = () => {
    setUndoStack((prev) => [...prev.slice(-20), [...fields]]);
  };

  const addField = (type: BookingFieldType) => {
    if (fields.some((f) => f.type === type)) return;
    const reg = FIELD_REGISTRY[type];
    pushUndo();
    const newField: IFormField = {
      id: `field_${type}_${Date.now()}`,
      type,
      label: t(reg.labelKey),
      placeholder: reg.placeholderKey ? t(reg.placeholderKey) : "",
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

  const updateField = (id: string, updates: Partial<IFormField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    pushUndo();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Handle button dragging
      if (String(active.id) === 'button-search') {
        // Button is being dragged over a field
        if (String(over.id) !== 'button-search') {
          const overId = String(over.id).replace("preview-", "");
          const fieldIndex = fields.findIndex((f) => f.id === overId);
          if (fieldIndex !== -1) {
            setFormStyle((prev) => ({
              ...prev,
              buttonPosition: fieldIndex,
            }));
            pushUndo();
          }
        }
        return;
      }
      
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
        style: {
          ...formStyle,
          // Ensure all optional fields have default values
          columns: formStyle.columns ?? 2,
          headingAlignment: formStyle.headingAlignment ?? "center",
          subHeadingAlignment: formStyle.subHeadingAlignment ?? "center",
          buttonAlignment: formStyle.buttonAlignment ?? "center",
          footerTextAlignment: formStyle.footerTextAlignment ?? "center",
          showLabels: formStyle.showLabels ?? false,
          inputSize: formStyle.inputSize ?? "default",
          fieldGap: formStyle.fieldGap ?? 12,
          inputBorderRadius: formStyle.inputBorderRadius ?? "0.5rem",
          buttonPosition: formStyle.buttonPosition, // Include button position if set
        },
        isActive: true,
        isDefault: currentLayout?.isDefault ?? false,
      };
      
      if (currentLayout?._id) {
        const data = await apiPatch<{ success: boolean; data: IFormLayout; message: string }>(
          `/api/form-layouts/${currentLayout._id}`, payload
        );
        if (data.success) {
          setCurrentLayout(data.data);
          setLastSaved(new Date());
          localStorage.removeItem("formBuilderDraft");
          await fetchLayouts();
          alert("Layout saved successfully!");
        } else {
          alert("Failed to save layout: " + (data.message || "Unknown error"));
        }
      } else {
        const data = await apiPost<{ success: boolean; data: IFormLayout; message: string }>(
          "/api/form-layouts", payload
        );
        if (data.success) {
          setCurrentLayout(data.data);
          setLastSaved(new Date());
          localStorage.removeItem("formBuilderDraft");
          await fetchLayouts();
          alert("Layout created successfully!");
        } else {
          alert("Failed to create layout: " + (data.message || "Unknown error"));
        }
      }
    } catch (error) {
      console.error("Error saving layout:", error);
      alert("Failed to save layout: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const selectLayout = async (layout: IFormLayout) => {
    try {
      // Fetch fresh data from server to ensure we have the latest version
      const data = await apiGet<{ success: boolean; data: IFormLayout }>(
        `/api/form-layouts/${layout._id}`
      );
      if (data.success && data.data) {
        const freshLayout = data.data;
        setCurrentLayout(freshLayout);
        setFields(freshLayout.fields || []);
        setFormStyle({ ...DEFAULT_STYLE, ...freshLayout.style });
        setLayoutName(freshLayout.name);
        setLayoutDescription(freshLayout.description || "");
        setSelectedFieldId(null);
        setUndoStack([]);
        setShowManager(false);
        localStorage.removeItem("formBuilderDraft");
      } else {
        console.warn("Failed to load fresh layout data, using fallback");
        // Fallback to the provided layout object
        setCurrentLayout(layout);
        setFields(layout.fields || []);
        setFormStyle({ ...DEFAULT_STYLE, ...layout.style });
        setLayoutName(layout.name);
        setLayoutDescription(layout.description || "");
        setSelectedFieldId(null);
        setUndoStack([]);
        setShowManager(false);
      }
    } catch (error) {
      console.error("Error loading layout:", error);
      // Fallback to the provided layout object
      setCurrentLayout(layout);
      setFields(layout.fields || []);
      setFormStyle({ ...DEFAULT_STYLE, ...layout.style });
      setLayoutName(layout.name);
      setLayoutDescription(layout.description || "");
      setSelectedFieldId(null);
      setUndoStack([]);
      setShowManager(false);
    }
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
        `/api/form-layouts/${id}/duplicate`, {}
      );
      if (data.success) {
        await fetchLayouts();
        // Automatically load the duplicated layout
        if (data.data) {
          await selectLayout(data.data);
        }
      }
    } catch (error) {
      console.error("Error duplicating layout:", error);
    }
  };

  const deleteLayout = async (id: string) => {
    try {
      await apiDelete<{ success: boolean }>(`/api/form-layouts/${id}`);
      if (currentLayout?._id === id) {
        createNew();
        localStorage.removeItem("formBuilderDraft");
      }
      await fetchLayouts();
    } catch (error) {
      console.error("Error deleting layout:", error);
    }
  };

  const setDefaultLayout = async (id: string) => {
    try {
      const data = await apiPatch<{ success: boolean; data: IFormLayout }>(
        `/api/form-layouts/${id}`, 
        { isDefault: true }
      );
      if (data.success && data.data && currentLayout?._id === id) {
        // Update currentLayout if it's the one being set as default
        setCurrentLayout(data.data);
      }
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
                  placeholder={t("ui.layout_name_placeholder")}
                  className="text-2xl font-bold h-auto py-1 px-2 w-64"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingName(false);
                    if (e.key === "Escape") setEditingName(false);
                  }}
                />
                <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <h1
                className="text-2xl sm:text-3xl font-bold text-foreground cursor-pointer hover:text-primary/80 transition-colors flex items-center gap-2 group"
                onClick={() => setEditingName(true)}
              >
                {layoutName || t("ui.untitled_layout")}
                <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>
            )}
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground text-sm">
                {t("ui.fields_enabled", { enabled: fields.filter((f) => f.enabled).length, total: fields.length })}
              </p>
              {lastSaved && (
                <span className="text-xs text-muted-foreground">
                  {t("ui.saved_at", { time: lastSaved.toLocaleTimeString() })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            {t("reset")}
          </Button>
          <Dialog open={showManager} onOpenChange={setShowManager}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <LayoutTemplate className="h-4 w-4 mr-2" />
                {t("layouts")}
                {layouts.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs h-5">{layouts.length}</Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("layout_manager")}</DialogTitle>
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
          <Button onClick={saveLayout} disabled={isSaving || !layoutName.trim()} size="sm">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {t("save_layout")}
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
          
          {/* ── Left Sidebar ── */}
          <div className="lg:col-span-3">
            <Card className="border border-border bg-card overflow-hidden sticky top-6 h-[calc(100vh-140px)] flex flex-col">
              <CardHeader className="p-0 shrink-0">
                <div className="px-4 pt-4 pb-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardTitle className="text-base">{t("form_elements")}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{t("click_to_add")}</CardDescription>
                </div>
              </CardHeader>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                    {t("available_fields")}
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(FIELD_REGISTRY) as BookingFieldType[])
                      .filter((type) => !fields.some((f) => f.type === type))
                      .map((type) => {
                        const reg = FIELD_REGISTRY[type];
                        const Icon = reg.icon;
                        const isImportant = ["pickup", "dropoff", "date", "time"].includes(type);
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
                            <Icon className={`h-3.5 w-3.5 shrink-0 group-hover:scale-110 transition-transform ${isImportant ? "text-amber-600" : "text-primary"}`} />
                            <span className={`truncate ${isImportant ? "font-semibold text-amber-900" : ""}`}>
                              {t(reg.labelKey)}
                            </span>
                          </Button>
                        );
                      })}
                  </div>
                  {(Object.keys(FIELD_REGISTRY) as BookingFieldType[]).filter((type) => !fields.some((f) => f.type === type)).length === 0 && (
                    <div className="text-[10px] text-muted-foreground text-center py-2 px-3 border border-dashed rounded-md bg-muted/20">
                      {t("all_fields_added")}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-2">
                    <Layers className="h-3 w-3" /> {t("canvas_title")}
                  </Label>
                  {fields.length === 0 ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg bg-muted/10">
                      <Plus className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground font-medium">{t("empty_form")}</p>
                    </div>
                  ) : (
                    <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
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
              </div>
            </Card>
          </div>

          {/* ── Center: Canvas ── */}
          <div className="lg:col-span-6">
            <Card className="border border-border bg-card overflow-hidden h-full flex flex-col">
              <CardHeader className="p-0 shrink-0">
                <div className="px-4 pt-4 pb-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10 flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4 text-primary" /> {t("preview")}
                      {isTabletOrMobile && (
                        <Badge variant="secondary" className="text-[10px] ml-2">Auto-Mobile</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {previewMode === 'mobile' ? 'Mobile View (Auto)' : `Desktop Grid (${formStyle.columns || 2} Cols)`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 bg-muted rounded-md p-0.5 border">
                    <button
                      onClick={() => setPreviewMode("desktop")}
                      disabled={isTabletOrMobile} // Disable manual override if auto-active
                      className={`p-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition-all ${
                        previewMode === "desktop" ? "bg-card shadow-sm text-primary" : "hover:bg-card/50 text-muted-foreground"
                      } ${isTabletOrMobile ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Monitor className="h-3.5 w-3.5" /> Desktop
                    </button>
                    <button
                      onClick={() => setPreviewMode("mobile")}
                      disabled={isTabletOrMobile}
                      className={`p-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition-all ${
                        previewMode === "mobile" ? "bg-card shadow-sm text-primary" : "hover:bg-card/50 text-muted-foreground"
                      } ${isTabletOrMobile ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Smartphone className="h-3.5 w-3.5" /> Mobile
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-slate-50/50 flex-1 overflow-y-auto flex items-center justify-center">
                <div
                  className={`w-full transition-all duration-500 ease-in-out ${
                    previewMode === "mobile" ? "max-w-[360px] border-x-8 border-y-[16px] border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden bg-white" : "max-w-full"
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

          {/* ── Right Sidebar: Properties ── */}
          <div className="lg:col-span-3">
            <Card className="border border-border bg-card overflow-hidden sticky top-6 h-[calc(100vh-140px)] flex flex-col">
              <Tabs defaultValue="properties" className="w-full flex flex-col h-full">
                <CardHeader className="p-0 shrink-0">
                  <div className="px-4 pt-4 pb-0 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
                    <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 pb-3 h-auto">
                      <TabsTrigger value="properties" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md py-1.5 text-xs text-muted-foreground data-[state=active]:text-foreground">
                        {t("properties")}
                      </TabsTrigger>
                      <TabsTrigger value="design" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md py-1.5 text-xs text-muted-foreground data-[state=active]:text-foreground">
                        {t("design")}
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>
                
                <div className="flex-1 overflow-y-auto">
                  <CardContent className="p-4">
                    <TabsContent value="properties" className="mt-0 space-y-5">
                      {selectedFieldId === '__button_search' ? (
                        // ─── Button Properties ───
                        <div className="space-y-5">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                            <div className="rounded-md bg-primary/10 p-2.5">
                              <ArrowRight className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{t("button_properties.search_button")}</p>
                              <p className="text-[11px] text-muted-foreground">{t("button_properties.configure_button")}</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("button_properties.content")}</Label>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("button_properties.button_text")}</Label>
                              <Input
                                value={formStyle.buttonText}
                                onChange={(e) => setFormStyle((s) => ({ ...s, buttonText: e.target.value }))}
                                className="h-8 text-sm"
                                placeholder={t("button_properties.button_text")}
                              />
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("button_properties.layout")}</Label>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("button_properties.width")}</Label>
                              <Select
                                value={formStyle.buttonWidth || "full"}
                                onValueChange={(v) => setFormStyle((s) => ({ ...s, buttonWidth: v as any }))}
                              >
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full">{t("button_properties.full_width")}</SelectItem>
                                  <SelectItem value="two-thirds">{t("button_properties.two_thirds")}</SelectItem>
                                  <SelectItem value="half">{t("button_properties.half")}</SelectItem>
                                  <SelectItem value="third">{t("button_properties.third")}</SelectItem>
                                  <SelectItem value="quarter">{t("button_properties.quarter")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("button_properties.alignment")}</Label>
                              <div className="flex gap-1">
                                {(['left', 'center', 'right'] as const).map((align) => (
                                  <button
                                    key={align}
                                    onClick={() => setFormStyle((s) => ({ ...s, buttonAlignment: align }))}
                                    className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                                      formStyle.buttonAlignment === align
                                        ? 'bg-primary text-white'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                    title={t(`button_properties.${align}`)}
                                  >
                                    {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("button_properties.size")}</Label>
                              <Select
                                value={formStyle.buttonSize || "default"}
                                onValueChange={(v) => setFormStyle((s) => ({ ...s, buttonSize: v as any }))}
                              >
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="small">{t("button_properties.small")}</SelectItem>
                                  <SelectItem value="default">{t("button_properties.default")}</SelectItem>
                                  <SelectItem value="large">{t("button_properties.large")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("button_properties.styling")}</Label>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("button_properties.background_color")}</Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={formStyle.buttonColor}
                                  onChange={(e) => setFormStyle((s) => ({ ...s, buttonColor: e.target.value }))}
                                  className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                />
                                <Input className="h-8 text-xs font-mono flex-1" value={formStyle.buttonColor} onChange={(e) => setFormStyle((s) => ({ ...s, buttonColor: e.target.value }))} />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("button_properties.text_color")}</Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={formStyle.buttonTextColor}
                                  onChange={(e) => setFormStyle((s) => ({ ...s, buttonTextColor: e.target.value }))}
                                  className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                />
                                <Input className="h-8 text-xs font-mono flex-1" value={formStyle.buttonTextColor} onChange={(e) => setFormStyle((s) => ({ ...s, buttonTextColor: e.target.value }))} />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("button_properties.border_radius")}</Label>
                              <Input
                                value={formStyle.buttonBorderRadius || "0.5rem"}
                                onChange={(e) => setFormStyle((s) => ({ ...s, buttonBorderRadius: e.target.value }))}
                                className="h-8 text-xs font-mono"
                                placeholder="0.5rem"
                              />
                            </div>
                          </div>
                        </div>
                      ) : selectedField ? (
                        <div className="space-y-5">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                            {(() => {
                              const reg = FIELD_REGISTRY[selectedField.type];
                              const Icon = reg?.icon || MapPin;
                              return (
                                <>
                                  <div className="rounded-md bg-primary/10 p-2.5">
                                    <Icon className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold">{t(reg.labelKey)}</p>
                                    <p className="text-[11px] text-muted-foreground">{t(reg.descriptionKey)}</p>
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content</Label>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("header_text")}</Label>
                              <Input
                                value={selectedField.label}
                                onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                            {!["booking-type", "trip-type", "stops"].includes(selectedField.type) && (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">{t("placeholder")}</Label>
                                <Input
                                  value={selectedField.placeholder || ""}
                                  onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                  className="h-8 text-sm"
                                />
                              </div>
                            )}
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Desktop Layout</Label>
                            </div>
                            
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Grid Width</Label>
                              <Select
                                value={selectedField.width}
                                onValueChange={(v) => updateField(selectedField.id, { width: v as IFormField["width"] })}
                              >
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full">Full Width (100%)</SelectItem>
                                  <SelectItem value="two-thirds">Two-Thirds (66%)</SelectItem>
                                  <SelectItem value="half">Half (50%)</SelectItem>
                                  <SelectItem value="third">Third (33%)</SelectItem>
                                  <SelectItem value="quarter">Quarter (25%)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {!selectedField.visibleWhen?.bookingType && (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" /> Hourly Mode Width
                                  <span className="text-[9px] text-muted-foreground font-normal ml-auto">Optional</span>
                                </Label>
                                <Select
                                  value={selectedField.widthWhenHourly || "inherit"}
                                  onValueChange={(v) => updateField(selectedField.id, { widthWhenHourly: v === "inherit" ? undefined : (v as IFormField["width"]) })}
                                >
                                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="inherit">Same as Default</SelectItem>
                                    <SelectItem value="full">Full Width</SelectItem>
                                    <SelectItem value="two-thirds">Two-Thirds</SelectItem>
                                    <SelectItem value="half">Half</SelectItem>
                                    <SelectItem value="third">Third</SelectItem>
                                    <SelectItem value="quarter">Quarter</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mobile Layout</Label>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Mobile Width Override</Label>
                              <p className="text-[10px] text-muted-foreground">How this field behaves on small screens.</p>
                              <Select
                                value={selectedField.mobileWidth || "inherit"}
                                onValueChange={(v) => updateField(selectedField.id, { mobileWidth: v === "inherit" ? undefined : (v as IFormField["width"]) })}
                              >
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="inherit">Same as Desktop</SelectItem>
                                  <SelectItem value="full">Full Width</SelectItem>
                                  <SelectItem value="two-thirds">Two-Thirds</SelectItem>
                                  <SelectItem value="half">Half (Side-by-side)</SelectItem>
                                  <SelectItem value="third">Third</SelectItem>
                                  <SelectItem value="quarter">Quarter</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium flex items-center gap-1.5">
                                <Clock className="h-3 w-3" /> Mobile Hourly Mode Width
                                <span className="text-[9px] text-muted-foreground font-normal ml-auto">Optional</span>
                              </Label>
                              <Select
                                value={selectedField.mobileWidthWhenHourly || "inherit"}
                                onValueChange={(v) => updateField(selectedField.id, { mobileWidthWhenHourly: v === "inherit" ? undefined : (v as IFormField["width"]) })}
                              >
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="inherit">Same as Mobile Default</SelectItem>
                                  <SelectItem value="full">Full Width</SelectItem>
                                  <SelectItem value="two-thirds">Two-Thirds</SelectItem>
                                  <SelectItem value="half">Half (Side-by-side)</SelectItem>
                                  <SelectItem value="third">Third</SelectItem>
                                  <SelectItem value="quarter">Quarter</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Logic & Validation</Label>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-xs font-medium">{t("required")}</Label>
                                {FIELD_REGISTRY[selectedField.type]?.locked && <p className="text-[10px] text-muted-foreground">Core field</p>}
                              </div>
                              <Switch 
                                checked={selectedField.required} 
                                disabled={FIELD_REGISTRY[selectedField.type]?.locked}
                                onCheckedChange={(c) => updateField(selectedField.id, { required: c })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-xs font-medium">{t("enabled")}</Label>
                              </div>
                              <Switch 
                                checked={selectedField.enabled} 
                                disabled={FIELD_REGISTRY[selectedField.type]?.locked}
                                onCheckedChange={() => toggleField(selectedField.id)}
                              />
                            </div>
                          </div>

                          {["booking-type", "trip-type"].includes(selectedField.type) && (
                            <div className="space-y-3">
                              <Separator />
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Styling</Label>
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="text-xs font-medium">Remove Border Container</Label>
                                  <p className="text-[10px] text-muted-foreground">Hide the bordered box around buttons</p>
                                </div>
                                <Switch 
                                  checked={selectedField.showBorder === false}
                                  onCheckedChange={(isRemovingBorder) => {
                                    const newValue = isRemovingBorder ? false : true;
                                    console.log("Toggled showBorder to:", newValue);
                                    updateField(selectedField.id, { showBorder: newValue });
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {selectedField.visibleWhen && (
                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-md space-y-2">
                              <p className="text-[10px] font-semibold text-blue-900 uppercase tracking-wider">Conditional Visibility</p>
                              {selectedField.visibleWhen.bookingType && (
                                <div className="flex items-center gap-2 text-xs text-blue-800">
                                  <Eye className="h-3 w-3" />
                                  <span>Only in <Badge variant="secondary" className="text-[10px] bg-white">{selectedField.visibleWhen.bookingType}</Badge> mode</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="rounded-full bg-muted p-4 mb-3">
                            <Settings2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">{t("ui.select_field_to_configure")}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">Click an element on the canvas</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="design" className="mt-0 space-y-6">
                      {/* VISIBILITY TOGGLES */}
                      <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visibility</Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Show Header</Label>
                            <Switch checked={formStyle.showHeader} onCheckedChange={(c) => setFormStyle((s) => ({ ...s, showHeader: c }))} />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Show Steps</Label>
                            <Switch checked={formStyle.showSteps} onCheckedChange={(c) => setFormStyle((s) => ({ ...s, showSteps: c }))} />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Show Footer</Label>
                            <Switch checked={formStyle.showFooter} onCheckedChange={(c) => setFormStyle((s) => ({ ...s, showFooter: c }))} />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* LAYOUT & GRID */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Columns className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Layout</Label>
                        </div>
                        <div className="space-y-3 pl-1">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-medium">Desktop Columns</Label>
                              <span className="text-xs font-mono bg-muted px-1.5 rounded">{formStyle.columns || 2}</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="12"
                              step="1"
                              value={formStyle.columns || 2}
                              onChange={(e) => setFormStyle((s) => ({ ...s, columns: parseInt(e.target.value) }))}
                              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between text-[9px] text-muted-foreground px-1 font-mono">
                              <span>1</span><span>6</span><span>12</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-medium">Field Gap</Label>
                              <span className="text-xs font-mono bg-muted px-1.5 rounded">{formStyle.fieldGap ?? 12}px</span>
                            </div>
                            <input
                              type="range"
                              min="4"
                              max="32"
                              step="2"
                              value={formStyle.fieldGap ?? 12}
                              onChange={(e) => setFormStyle((s) => ({ ...s, fieldGap: parseInt(e.target.value) }))}
                              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* BACKGROUND & APPEARANCE */}
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Background & Effects</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px]">Background Color</Label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={formStyle.backgroundColor} onChange={(e) => setFormStyle((s) => ({ ...s, backgroundColor: e.target.value }))} className="h-8 w-8 rounded cursor-pointer border-0 p-0" />
                              <Input className="h-8 text-xs font-mono" value={formStyle.backgroundColor} onChange={(e) => setFormStyle((s) => ({ ...s, backgroundColor: e.target.value }))} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Primary Color</Label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={formStyle.primaryColor} onChange={(e) => setFormStyle((s) => ({ ...s, primaryColor: e.target.value }))} className="h-8 w-8 rounded cursor-pointer border-0 p-0" />
                              <Input className="h-8 text-xs font-mono" value={formStyle.primaryColor} onChange={(e) => setFormStyle((s) => ({ ...s, primaryColor: e.target.value }))} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-medium">Transparency</Label>
                            <span className="text-xs font-mono bg-muted px-1.5 rounded">{formStyle.backgroundOpacity}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={formStyle.backgroundOpacity}
                            onChange={(e) => setFormStyle((s) => ({ ...s, backgroundOpacity: parseInt(e.target.value) }))}
                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <div className="flex justify-between text-[9px] text-muted-foreground px-1">
                            <span>Transparent</span><span>Opaque</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <Label className="text-xs font-medium">Glass Effect</Label>
                          <Switch checked={formStyle.glassEffect} onCheckedChange={(c) => setFormStyle((s) => ({ ...s, glassEffect: c }))} />
                        </div>
                      </div>

                      <Separator />

                      {/* BORDER RADIUS */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CornerDownRight className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Border Radius</Label>
                        </div>
                        <div className="space-y-3 pl-1">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-medium">Container Radius</Label>
                              <span className="text-xs font-mono bg-muted px-1.5 rounded">{formStyle.borderRadius}</span>
                            </div>
                            <Input
                              value={formStyle.borderRadius}
                              onChange={(e) => setFormStyle((s) => ({ ...s, borderRadius: e.target.value }))}
                              className="h-8 text-xs font-mono"
                              placeholder="0.75rem"
                            />
                            <p className="text-[10px] text-muted-foreground">Use rem, px, or % units (e.g., 0.75rem, 12px)</p>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-medium">Input Radius</Label>
                              <span className="text-xs font-mono bg-muted px-1.5 rounded">{formStyle.inputBorderRadius || "0.5rem"}</span>
                            </div>
                            <Input
                              value={formStyle.inputBorderRadius || "0.5rem"}
                              onChange={(e) => setFormStyle((s) => ({ ...s, inputBorderRadius: e.target.value }))}
                              className="h-8 text-xs font-mono"
                              placeholder="0.5rem"
                            />
                            <p className="text-[10px] text-muted-foreground">Use rem, px, or % units (e.g., 0.5rem, 8px)</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* HEADER SECTION */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Type className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Header</Label>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Title</Label>
                          <Input
                            value={formStyle.headingText}
                            onChange={(e) => setFormStyle((s) => ({ ...s, headingText: e.target.value }))}
                            className="h-8 text-xs"
                            placeholder="Enter header text"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Title Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formStyle.headingColor}
                              onChange={(e) => setFormStyle((s) => ({ ...s, headingColor: e.target.value }))}
                              className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <Input className="h-8 text-xs font-mono flex-1" value={formStyle.headingColor} onChange={(e) => setFormStyle((s) => ({ ...s, headingColor: e.target.value }))} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Title Alignment</Label>
                          <div className="flex gap-1">
                            {(['left', 'center', 'right'] as const).map((align) => (
                              <button
                                key={align}
                                onClick={() => setFormStyle((s) => ({ ...s, headingAlignment: align }))}
                                className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                                  formStyle.headingAlignment === align
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                                title={align.charAt(0).toUpperCase() + align.slice(1)}
                              >
                                {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Subtitle</Label>
                          <Input
                            value={formStyle.subHeadingText || ""}
                            onChange={(e) => setFormStyle((s) => ({ ...s, subHeadingText: e.target.value }))}
                            className="h-8 text-xs"
                            placeholder="Enter subtitle text"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Subtitle Alignment</Label>
                          <div className="flex gap-1">
                            {(['left', 'center', 'right'] as const).map((align) => (
                              <button
                                key={align}
                                onClick={() => setFormStyle((s) => ({ ...s, subHeadingAlignment: align }))}
                                className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                                  formStyle.subHeadingAlignment === align
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                                title={align.charAt(0).toUpperCase() + align.slice(1)}
                              >
                                {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* INPUT & TEXT COLORS */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Text & Input Colors</Label>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Body Text Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formStyle.textColor}
                              onChange={(e) => setFormStyle((s) => ({ ...s, textColor: e.target.value }))}
                              className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <Input className="h-8 text-xs font-mono flex-1" value={formStyle.textColor} onChange={(e) => setFormStyle((s) => ({ ...s, textColor: e.target.value }))} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Label Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formStyle.labelColor}
                              onChange={(e) => setFormStyle((s) => ({ ...s, labelColor: e.target.value }))}
                              className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <Input className="h-8 text-xs font-mono flex-1" value={formStyle.labelColor} onChange={(e) => setFormStyle((s) => ({ ...s, labelColor: e.target.value }))} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Input Text Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formStyle.inputTextColor}
                              onChange={(e) => setFormStyle((s) => ({ ...s, inputTextColor: e.target.value }))}
                              className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <Input className="h-8 text-xs font-mono flex-1" value={formStyle.inputTextColor} onChange={(e) => setFormStyle((s) => ({ ...s, inputTextColor: e.target.value }))} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Input Background Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formStyle.inputBackgroundColor}
                              onChange={(e) => setFormStyle((s) => ({ ...s, inputBackgroundColor: e.target.value }))}
                              className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <Input className="h-8 text-xs font-mono flex-1" value={formStyle.inputBackgroundColor} onChange={(e) => setFormStyle((s) => ({ ...s, inputBackgroundColor: e.target.value }))} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Input Border Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formStyle.inputBorderColor}
                              onChange={(e) => setFormStyle((s) => ({ ...s, inputBorderColor: e.target.value }))}
                              className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <Input className="h-8 text-xs font-mono flex-1" value={formStyle.inputBorderColor} onChange={(e) => setFormStyle((s) => ({ ...s, inputBorderColor: e.target.value }))} />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* BUTTON STYLING */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Settings2 className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buttons</Label>
                        </div>

                        <div className="space-y-2 bg-muted/20 p-3 rounded border border-muted">
                          <Label className="text-xs font-medium text-muted-foreground">{t("button_properties.search_button")}</Label>
                          <p className="text-[10px] text-muted-foreground">{t("button_properties.click_to_configure")}</p>
                        </div>

                        <div className="space-y-2 bg-muted/20 p-3 rounded border border-muted">
                          <Label className="text-xs font-medium text-muted-foreground">Booking Type Button</Label>
                          <div className="space-y-1.5">
                            <Label className="text-[10px]">Background Color</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={formStyle.bookingTypeButtonColor || "#0f172a"}
                                onChange={(e) => setFormStyle((s) => ({ ...s, bookingTypeButtonColor: e.target.value }))}
                                className="h-7 w-7 rounded cursor-pointer border-0 p-0"
                              />
                              <Input className="h-7 text-xs font-mono flex-1" value={formStyle.bookingTypeButtonColor || "#0f172a"} onChange={(e) => setFormStyle((s) => ({ ...s, bookingTypeButtonColor: e.target.value }))} />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px]">Text Color</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={formStyle.bookingTypeButtonTextColor || "#ffffff"}
                                onChange={(e) => setFormStyle((s) => ({ ...s, bookingTypeButtonTextColor: e.target.value }))}
                                className="h-7 w-7 rounded cursor-pointer border-0 p-0"
                              />
                              <Input className="h-7 text-xs font-mono flex-1" value={formStyle.bookingTypeButtonTextColor || "#ffffff"} onChange={(e) => setFormStyle((s) => ({ ...s, bookingTypeButtonTextColor: e.target.value }))} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* FOOTER SECTION */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Type className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Footer</Label>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Footer Text</Label>
                          <Input
                            value={formStyle.footerText}
                            onChange={(e) => setFormStyle((s) => ({ ...s, footerText: e.target.value }))}
                            className="h-8 text-xs"
                            placeholder="Enter footer text"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Text Alignment</Label>
                          <div className="flex gap-1">
                            {(['left', 'center', 'right'] as const).map((align) => (
                              <button
                                key={align}
                                onClick={() => setFormStyle((s) => ({ ...s, footerTextAlignment: align }))}
                                className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                                  formStyle.footerTextAlignment === align
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                                title={align.charAt(0).toUpperCase() + align.slice(1)}
                              >
                                {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">Show Footer Images</Label>
                          <Switch checked={formStyle.showFooterImages} onCheckedChange={(c) => setFormStyle((s) => ({ ...s, showFooterImages: c }))} />
                        </div>
                      </div>
                    </TabsContent>
                  </CardContent>
                </div>
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