"use client";

import React from "react";
import Image from "next/image";
import { AlertCircle, Car, CheckCircle, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { IFormField, IFormStyle } from "@/models/form-layout";
import type { CSSProperties, FormEvent, RefObject } from "react";
import type { useTranslations } from "next-intl";

export function CustomEmbeddableFormShell({
  t,
  style,
  fields,
  isMounted,
  containerStyle,
  handleSubmit,
  renderField,
  renderSubmitButton,
  mapLoaded,
  mapRef,
}: {
  t: ReturnType<typeof useTranslations<"embeddable">>;
  style: IFormStyle;
  fields: IFormField[];
  isMounted: boolean;
  containerStyle: CSSProperties;
  handleSubmit: (e: FormEvent) => void;
  renderField: (field: IFormField) => React.ReactNode;
  renderSubmitButton: () => React.ReactNode;
  mapLoaded: boolean;
  mapRef: RefObject<HTMLDivElement | null>;
}) {
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
                {fields.map((field, fieldIndex) => (
                  <React.Fragment key={field.id}>
                    {/* Render button at its position if set */}
                    {style.buttonPosition === fieldIndex && renderSubmitButton()}
                    {renderField(field)}
                  </React.Fragment>
                ))}
                {/* Render button at the end if buttonPosition is not set or is beyond field count */}
                {(style.buttonPosition === undefined || style.buttonPosition >= fields.length) && renderSubmitButton()}
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
