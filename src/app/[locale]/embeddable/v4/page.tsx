"use client";

import { BookingFormProvider } from "@/features/booking/context/booking-form-context";
import { EmbeddableV4Form } from "@/features/booking/ui/embeddable/v4/embeddable-v4-form";

export default function EmbeddableV4Page() {
  return (
    <BookingFormProvider>
      <EmbeddableV4Form />
    </BookingFormProvider>
  );
}
