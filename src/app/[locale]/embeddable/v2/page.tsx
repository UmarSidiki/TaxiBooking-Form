"use client";

import { EmbeddableV2Form } from "@/features/booking/ui/embeddable/v2/embeddable-v2-form";
import { BookingFormProvider } from "@/features/booking/context/booking-form-context";

export default function EmbeddableBookingPage() {
  return (
    <BookingFormProvider>
      <EmbeddableV2Form />
    </BookingFormProvider>
  );
}
