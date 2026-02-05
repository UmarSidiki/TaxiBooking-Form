"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { apiGet } from "@/utils/api";
import { ISetting } from "@/models/settings";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Car,
  ChevronRight,
  Phone,
  Mail,
  Baby,
  Plane,
  Star,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Booking {
  _id: string;
  tripId: string;
  pickup: string;
  dropoff: string;
  stops?: Array<{ location: string; order: number; duration?: number }>;
  date: string;
  time: string;
  returnDate?: string;
  returnTime?: string;
  tripType: string;
  passengers: number;
  childSeats: number;
  babySeats: number;
  flightNumber?: string;
  notes?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleDetails: {
    name: string;
    price: string;
    seats: string;
  };
  totalAmount: number;
  status: string;
  paymentStatus: string;
}

export default function PartnerHistoryPage() {
  const t = useTranslations("Dashboard.Partners.Rides");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingReviews, setBookingReviews] = useState<Record<string, { rating: number; comment: string; createdAt: Date } | null>>({});
  const [timezone, setTimezone] = useState<string>("Europe/Zurich");

  const fetchSettings = useCallback(async () => {
    try {
      const data = await apiGet<{ success: boolean; data: ISetting }>("/api/settings");
      if (data.success && data.data.timezone) {
        setTimezone(data.data.timezone);
      }
    } catch(e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const isBookingPassed = useCallback((dateStr: string, timeStr: string) => {
    try {
      const nowInTzStr = new Date().toLocaleString('en-US', { timeZone: timezone, hour12: false });
      const nowInTz = new Date(nowInTzStr);
      const bookingDate = new Date(`${dateStr}T${timeStr}:00`);
      return bookingDate < nowInTz;
    } catch (e) {
      return new Date(`${dateStr}T${timeStr}:00`) < new Date();
    }
  }, [timezone]);

  useEffect(() => {
    fetchRides();
  }, [timezone]); // Refetch/Re-Evaluate if timezone changes? Or just fetchRides depends on it? 

  const fetchRides = async () => {
    try {
      const response = await fetch("/api/partners/rides");
      const data = await response.json();

      if (data.success) {
        setBookings(data.data);
        
        // Fetch reviews for completed rides
        const completedBookings = data.data.filter(
          (b: Booking) => b.status === "canceled" || isBookingPassed(b.date, b.time)
        );
        
        for (const booking of completedBookings) {
          try {
            const reviewResponse = await fetch(`/api/reviews?bookingId=${booking._id}`);
            const reviewData = await reviewResponse.json();
            if (reviewData.success && reviewData.review) {
              setBookingReviews(prev => ({ ...prev, [booking._id]: reviewData.review }));
            }
          } catch (error) {
            console.error("Error fetching review for booking:", booking._id, error);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching rides:", error);
    } finally {
      setLoading(false);
    }
  };

  const getHistoryBookings = () => {
    return bookings.filter(
      (b) => b.status === "canceled" || isBookingPassed(b.date, b.time)
    );
  };

  const historyBookings = getHistoryBookings();

  const getStatusBadge = (booking: Booking) => {
    if (booking.status === "canceled") {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          {t("canceled")}
        </Badge>
      );
    }

    if (isBookingPassed(booking.date, booking.time)) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          {t("completed")}
        </Badge>
      );
    }

    return (
      <Badge className="flex items-center gap-1 bg-primary">{t("upcoming")}</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("history")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("view-your-completed-and-canceled-rides")}
        </p>
      </div>

      {/* Rides List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("ride-history")} ({historyBookings.length})
          </CardTitle>
          <CardDescription>
            {t("view-your-completed-and-canceled-rides")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t("no-ride-history-yet")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyBookings.map((booking) => (
                <Card
                  key={booking._id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Car className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {t("trip")}{booking.tripId.slice(0, 8)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {booking.vehicleDetails.name}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(booking)}
                      </div>

                      {/* Date & Time */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {booking.tripType === "roundtrip"
                              ? t("departure")
                              : t("date")}
                          </div>
                          <p className="text-sm font-medium">
                            {new Date(booking.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {t("time")}
                          </div>
                          <p className="text-sm font-medium">
                            {booking.time}
                          </p>
                        </div>
                        {booking.tripType === "roundtrip" &&
                          booking.returnDate && (
                            <>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {t("return")}
                                </div>
                                <p className="text-sm font-medium">
                                  {new Date(
                                    booking.returnDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {t("time")}
                                </div>
                                <p className="text-sm font-medium">
                                  {booking.returnTime}
                                </p>
                              </div>
                            </>
                          )}
                      </div>

                      {/* Route */}
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-medium">{t("route")}:</span>
                          {booking.stops && booking.stops.length > 0 ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="max-w-[8rem] truncate">
                                {booking.pickup}
                              </span>
                              {booking.stops
                                .sort((a, b) => a.order - b.order)
                                .map((stop, index) => (
                                  <span key={index} className="flex items-center gap-1">
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="max-w-[8rem] truncate">
                                      {stop.location}
                                    </span>
                                  </span>
                                ))}
                              {booking.dropoff && (
                                <>
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                  <span className="max-w-[8rem] truncate">
                                    {booking.dropoff}
                                  </span>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="max-w-[10rem] truncate">
                                {booking.pickup}
                              </span>
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <span className="max-w-[10rem] truncate">
                                {booking.dropoff}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Passenger Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {t("passenger")}:
                          </span>
                          <span className="font-medium">
                            {booking.firstName} {booking.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{booking.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium truncate">
                            {booking.email}
                          </span>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {t("passengers")}:
                          </span>
                          <span className="font-medium">
                            {booking.passengers}
                          </span>
                        </div>
                        {booking.childSeats > 0 && (
                          <div className="flex items-center gap-2">
                            <Baby className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {t("child-seats")}:
                            </span>
                            <span className="font-medium">
                              {booking.childSeats}
                            </span>
                          </div>
                        )}
                        {booking.babySeats > 0 && (
                          <div className="flex items-center gap-2">
                            <Baby className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {t("baby-seats")}:
                            </span>
                            <span className="font-medium">
                              {booking.babySeats}
                            </span>
                          </div>
                        )}
                        {booking.flightNumber && (
                          <div className="flex items-center gap-2">
                            <Plane className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {t("flight")}:
                            </span>
                            <span className="font-medium">
                              {booking.flightNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {booking.notes && (
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
                          <p className="text-xs font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                            {t("special-requests")}:
                          </p>
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            {booking.notes}
                          </p>
                        </div>
                      )}

                      {/* Customer Review */}
                      {bookingReviews[booking._id] && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                              Customer Review
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= bookingReviews[booking._id]!.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                            <span className="text-sm font-semibold text-gray-900">
                              {bookingReviews[booking._id]!.rating}/5
                            </span>
                          </div>
                          <p className="text-sm text-blue-800 dark:text-blue-200 italic">
                            &ldquo;{bookingReviews[booking._id]!.comment}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
