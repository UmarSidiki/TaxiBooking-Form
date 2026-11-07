"use client";

import { Clock, Users, Calendar, AlertCircle } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { PassengerStepper } from "@/features/booking/ui/passenger-stepper";
import type { IFormField } from "@/features/form-builder/model";
import type { CustomEmbeddableFieldCtx } from "@/features/booking/ui/embeddable/custom-embeddable-field-context";

type Ctx = CustomEmbeddableFieldCtx;

export function createScheduleFieldRenderers(ctx: Ctx) {
  const {
    style,
    formData,
    t,
    handleInputChange,
    handleInputBlur,
    getInputClass,
    inputStyle,
    iconColor,
    minDate,
    FieldLabel,
    errors,
  } = ctx;
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
      <PassengerStepper
        inputAriaLabel={field.label || t("passengers")}
        value={formData.passengers}
        onChange={(value) => handleInputChange("passengers", value)}
        onBlur={() => handleInputBlur("passengers")}
        decreaseLabel={t("decrease-passengers")}
        increaseLabel={t("increase-passengers")}
        icon={
          <Users
            className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4"
            style={{ color: iconColor }}
          />
        }
        inputClassName={`w-full ${getInputClass("passengers")}`}
        inputStyle={inputStyle}
        buttonClassName="border"
        buttonStyle={{
          backgroundColor: style.inputBackgroundColor,
          borderColor: style.inputBorderColor,
          color: style.inputTextColor,
        }}
      />
      {errors.passengers && (
        <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          <span className="truncate">{errors.passengers}</span>
        </div>
      )}
    </div>
  );

  // ─── Field dispatcher ─────────────────────────────────────────────────────

  return { renderDateField, renderTimeField, renderPassengers };
}
