import type { IFormField, IFormStyle } from "@/models/form-layout";
import type { useBookingForm } from "@/contexts/BookingFormContext";
import type { useStep1 } from "@/hooks/form/form-steps/useStep1";
import type { useTranslations } from "next-intl";
import type { CSSProperties, ReactNode } from "react";

type Step1 = ReturnType<typeof useStep1>;
type BookingForm = ReturnType<typeof useBookingForm>;

export type CustomEmbeddableFieldRendererProps = {
  style: IFormStyle;
  fields: IFormField[];
  formData: Step1["formData"];
  errors: Step1["errors"];
  t: ReturnType<typeof useTranslations<"embeddable">>;
  handleBookingTypeChange: Step1["handleBookingTypeChange"];
  handleTripTypeChange: Step1["handleTripTypeChange"];
  handleInputChange: Step1["handleInputChange"];
  handleInputBlur: Step1["handleInputBlur"];
  pickupInputRef: Step1["pickupInputRef"];
  dropoffInputRef: Step1["dropoffInputRef"];
  stopInputRefs: Step1["stopInputRefs"];
  mapLoaded: Step1["mapLoaded"];
  calculatingDistance: Step1["calculatingDistance"];
  isLoading: Step1["isLoading"];
  setFormData: BookingForm["setFormData"];
  iconColor: string | undefined;
  inputBaseClass: string;
  getInputClass: (fieldName: string) => string;
  inputStyle: CSSProperties;
  minDate: string;
  isHourly: boolean;
  handleAddStop: () => void;
  handleRemoveStop: (index: number) => void;
  handleStopDurationChange: (index: number, duration: number) => void;
  enabledFieldTypes: Set<string>;
};

export type CustomEmbeddableFieldCtx = CustomEmbeddableFieldRendererProps & {
  FieldLabel: (props: { field: IFormField }) => ReactNode;
};
