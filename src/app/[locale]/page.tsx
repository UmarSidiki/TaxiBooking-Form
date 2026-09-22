"use client";

import { BookingFormProvider } from "@/features/booking/context/booking-form-context";
import BookingFormContainer from "@/features/booking/ui/booking-form-container";

export default function Home() {
  return (
    <BookingFormProvider>
      <BookingFormContainer />
    </BookingFormProvider>
  );
}
