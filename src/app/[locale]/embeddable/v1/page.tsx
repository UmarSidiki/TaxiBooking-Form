"use client";

import { EmbeddableV1Form } from "@/components/embeddable/v1/embeddable-v1-form";
import { BookingFormProvider } from "@/contexts/BookingFormContext";

export default function EmbeddableBookingPage() {
  return (
    <BookingFormProvider>
      <EmbeddableV1Form />
    </BookingFormProvider>
  );
}
