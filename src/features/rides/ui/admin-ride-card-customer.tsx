"use client";

import type { IBooking } from "@/features/booking/model";
import { Mail, Phone } from "lucide-react";

export function AdminRideCardCustomer({ booking }: { booking: IBooking }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <p className="truncate text-sm font-medium text-foreground">
        {booking.firstName} {booking.lastName}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <a
          href={`mailto:${booking.email}`}
          className="inline-flex max-w-full items-center gap-1 truncate hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <Mail className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{booking.email}</span>
        </a>
        <a
          href={`tel:${booking.phone}`}
          className="inline-flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <Phone className="size-3 shrink-0" aria-hidden="true" />
          {booking.phone}
        </a>
      </div>
    </div>
  );
}
