"use client";

import { EmbeddableV2Form } from "@/components/embeddable/v2/embeddable-v2-form";
import { BookingFormProvider } from "@/contexts/BookingFormContext";

export default function EmbeddableBookingPage() {
  return (
    <BookingFormProvider>
      <EmbeddableV2Form />
    </BookingFormProvider>
  );
}
