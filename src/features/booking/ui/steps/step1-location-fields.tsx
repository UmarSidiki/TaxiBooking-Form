"use client";

import { Loader2 } from "lucide-react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { useTranslations } from "next-intl";

import type {
  FormData,
  FormErrors,
} from "@/features/booking/context/booking-form-context";
import { RouteRailFields } from "@/features/booking/ui/riviera/steps/route-rail-fields";

type TFn = ReturnType<typeof useTranslations>;

export function Step1LocationFields({
  t,
  formData,
  setFormData,
  errors,
  pickupInputRef,
  dropoffInputRef,
  stopInputRefs,
  handleInputBlur,
  handleAddStop,
  handleRemoveStop,
  handleStopChange,
  handleStopDurationChange,
  calculatingDistance,
}: {
  t: TFn;
  formData: FormData;
  setFormData: Dispatch<SetStateAction<FormData>>;
  errors: FormErrors;
  pickupInputRef: RefObject<HTMLInputElement | null>;
  dropoffInputRef: RefObject<HTMLInputElement | null>;
  stopInputRefs: { current: Array<HTMLInputElement | null> };
  handleInputBlur: (field: string) => void;
  handleAddStop: () => void;
  handleRemoveStop: (index: number) => void;
  handleStopChange: (index: number, location: string) => void;
  handleStopDurationChange: (index: number, duration: number) => void;
  calculatingDistance: boolean;
}) {
  return (
    <>
      <RouteRailFields
        t={t}
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        pickupInputRef={pickupInputRef}
        dropoffInputRef={dropoffInputRef}
        stopInputRefs={stopInputRefs}
        handleInputBlur={handleInputBlur}
        handleAddStop={handleAddStop}
        handleRemoveStop={handleRemoveStop}
        handleStopChange={handleStopChange}
        handleStopDurationChange={handleStopDurationChange}
      />

      {calculatingDistance && (
        <p className="text-xs text-[color:var(--ink2)] mt-1 flex items-center">
          <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
          {t("Step1.CalculatingDistance")}
        </p>
      )}
    </>
  );
}
