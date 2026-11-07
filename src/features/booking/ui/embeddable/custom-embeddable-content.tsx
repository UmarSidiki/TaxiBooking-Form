"use client";

import type { IFormLayout } from "@/features/form-builder/model";
import { useIframeBodyResize } from "@/features/booking/hooks/useIframeBodyResize";
import { DynamicBookingForm } from "@/features/booking/ui/embeddable/custom-dynamic-booking-form";

export function CustomEmbeddableContent({ layout }: { layout: IFormLayout }) {
  useIframeBodyResize();

  return <DynamicBookingForm layout={layout} />;
}
