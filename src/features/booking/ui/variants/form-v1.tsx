"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import providers and container to reduce initial bundle
const BookingFormProvider = dynamic(
  () => import("@/features/booking/context/booking-form-context").then(mod => ({ default: mod.BookingFormProvider })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
);

const BookingFormContainer = dynamic(
  () => import("@/features/booking/ui/booking-form-container"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
);

export default function Form_v1() {
  return (
    <BookingFormProvider>
      <BookingFormContainer />
    </BookingFormProvider>
  );
}
