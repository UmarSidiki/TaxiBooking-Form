"use client";

import { BookingFormProvider } from "@/contexts/BookingFormContext";
import BookingFormContainer from "@/components/form/BookingFormContainer";

export default function Form_v1() {
  return (
    <BookingFormProvider>
      <BookingFormContainer />
    </BookingFormProvider>
  );
}
