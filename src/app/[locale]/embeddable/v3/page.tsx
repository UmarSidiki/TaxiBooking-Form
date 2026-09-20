"use client";

import { EmbeddableV3Form } from "@/components/embeddable/v3/embeddable-v3-form";
import { BookingFormProvider } from "@/contexts/BookingFormContext";

export default function EmbeddableBookingPage() {
  return (
    <BookingFormProvider>
      <EmbeddableV3Form />
    </BookingFormProvider>
  );
}
