"use client";

import React, { useState } from "react";
import Image from "next/image";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { GridBackground } from "@/features/form-builder/ui/grid-background";
import { SortablePreviewItem } from "@/features/form-builder/ui/sortable-preview-item";
import { FormPreviewField } from "@/features/form-builder/ui/form-preview-field";
import type { IFormField, IFormStyle } from "@/features/form-builder/model";
import {
  ArrowLeftRight,
  ArrowRight,
  Calendar,
  CalendarDays,
  Car,
  CheckCircle,
  Clock,
  LayoutTemplate,
  MapPin,
  RefreshCw,
  Timer,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

export function FormPreview({
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
        className="flex flex-col items-center justify-center py-16 text-center transition-shadow duration-200 relative overflow-hidden"
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
    `w-full border pl-9 pr-3 ${inputPadding} ${inputText} transition-shadow duration-200 focus:outline-none focus:ring-2`;


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
                <div className="absolute top-3 left-1/2 w-full h-0.5 bg-border -z-10" />
              )}
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-shadow duration-200 ${
                  index === 0
                    ? "text-white shadow-sm"
                    : "border-border bg-card text-muted-foreground"
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
                className={`mt-1 text-xs font-medium ${
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
        className="p-4 sm:p-6 transition-shadow duration-200 relative overflow-hidden"
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
                      className={`font-semibold tracking-wide transition-shadow duration-200 shadow-md flex items-center justify-center gap-2 w-full ${
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
              <FormPreviewField
                field={field}
                style={style}
                previewMode={previewMode}
                previewBookingType={previewBookingType}
                setPreviewBookingType={setPreviewBookingType}
                previewTripType={previewTripType}
                setPreviewTripType={setPreviewTripType}
                t={t}
                inputBaseClass={inputBaseClass}
                onSelectField={onSelectField}
              />
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
                  className={`font-semibold tracking-wide transition-shadow duration-200 shadow-md flex items-center justify-center gap-2 w-full ${
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
