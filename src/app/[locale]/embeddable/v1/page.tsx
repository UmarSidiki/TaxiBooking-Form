"use client";

import { EmbeddableV1Form } from "@/features/booking/ui/embeddable/v1/embeddable-v1-form";
import { BookingFormProvider } from "@/features/booking/context/booking-form-context";

export default function EmbeddableBookingPage() {
  return (
    <BookingFormProvider>
      <EmbeddableV1Form />
    </BookingFormProvider>
  );
}
