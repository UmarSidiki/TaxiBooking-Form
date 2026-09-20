"use client";

import { CustomEmbeddableContent } from "@/features/booking/ui/embeddable/custom-embeddable-content";
import { BookingFormProvider } from "@/features/booking/context/booking-form-context";

export default function CustomEmbeddablePage() {
  return (
    <BookingFormProvider>
      <CustomEmbeddableContent />
    </BookingFormProvider>
  );
}
