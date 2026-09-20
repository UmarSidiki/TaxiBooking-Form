"use client";

import type { IBooking } from "@/features/booking/model";
import { Mail, PhoneCall, User } from "lucide-react";

export function AdminRideCardCustomer({ booking }: { booking: IBooking }) {
  return (
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                <span className="text-gray-700 truncate">
                  {booking.firstName} {booking.lastName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                <span className="text-gray-700 truncate">
                  {booking.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                <span className="text-gray-700">{booking.phone}</span>
              </div>
            </div>
  );
}
