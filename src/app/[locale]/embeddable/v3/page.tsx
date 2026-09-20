"use client";

import { EmbeddableV3Form } from "@/features/booking/ui/embeddable/v3/embeddable-v3-form";
import { BookingFormProvider } from "@/features/booking/context/booking-form-context";

export default function EmbeddableBookingPage() {
  return (
    <BookingFormProvider>
      <EmbeddableV3Form />
    </BookingFormProvider>
  );
}
