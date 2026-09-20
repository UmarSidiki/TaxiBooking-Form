"use client";

import { CustomEmbeddableContent } from "@/components/embeddable/custom-embeddable-content";
import { BookingFormProvider } from "@/contexts/BookingFormContext";

export default function CustomEmbeddablePage() {
  return (
    <BookingFormProvider>
      <CustomEmbeddableContent />
    </BookingFormProvider>
  );
}
