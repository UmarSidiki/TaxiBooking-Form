"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
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
  Route,
  CalendarDays,
  PhoneCall,
  UserCheck,
  User,
  Receipt,
  DollarSign,
  CreditCard,
  Ban,
  RefreshCw,
  Info,
  Eye,
  Navigation,
  CheckCircle,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiGet } from "@/utils/api";
import { ISetting } from "@/models/settings";

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
  selectedVehicle?: string;
  totalAmount: number;
  partnerPayoutAmount?: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  refundAmount?: number;
  refundPercentage?: number;
  canceledAt?: string;
}

export default function PartnerRidesPage() {
  const t = useTranslations("Dashboard.Partners.Rides");
  const tRides = useTranslations("Dashboard.Rides");
  const { currencySymbol } = useCurrency();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [timezone, setTimezone] = useState<string>("Europe/Zurich");

  useEffect(() => {
    fetchRides();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiGet<{ success: boolean; data: ISetting }>(
        "/api/settings"
      );
      if (data.success && data.data.timezone) {
        setTimezone(data.data.timezone);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

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

  const fetchRides = async () => {
    try {
      const response = await fetch("/api/partners/rides");
      const data = await response.json();

      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error("Error fetching rides:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingBookings = () => {
    return bookings.filter(
      (b) => b.status !== "canceled" && !isBookingPassed(b.date, b.time)
    );
  };

  const upcomingBookings = getUpcomingBookings();

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

  const getPaymentStatusBadge = (status: string) => {
    const badgeClasses =
      "text-white font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full text-xs";
    switch (status) {
      case "completed":
      case "paid":
        return (
          <Badge className={`${badgeClasses} bg-primary hover:bg-primary/90`}>
            <CheckCircle className="w-3 h-3" /> {tRides("Paid")}
          </Badge>
        );
      case "pending":
        return (
          <Badge className={`${badgeClasses} bg-yellow-500 hover:bg-yellow-600`}>
            <Clock className="w-3 h-3" /> {tRides("Pending")}
          </Badge>
        );
      case "refunded":
        return (
          <Badge className={`${badgeClasses} bg-blue-500 hover:bg-blue-600`}>
            <RefreshCw className="w-3 h-3" /> {tRides("Refunded")}
          </Badge>
        );
      case "failed":
        return (
          <Badge className={`${badgeClasses} bg-destructive hover:bg-destructive/90`}>
            <X className="w-3 h-3" /> {tRides("Failed")}
          </Badge>
        );
      default:
        return (
          <Badge className={`${badgeClasses} bg-muted hover:bg-muted/90 text-muted-foreground`}>
            {status}
          </Badge>
        );
    }
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
        <h1 className="text-3xl font-bold">{t("rides")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("your-upcoming-scheduled-rides")}
        </p>
      </div>

      {/* Rides List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("upcoming-rides")} ({upcomingBookings.length})
          </CardTitle>
          <CardDescription>
            {t("view-and-manage-your-assigned-rides")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t("no-upcoming-rides-found")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
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
                                  {t("trip")} #{booking.tripId.slice(0, 8)}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {booking.vehicleDetails.name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              {getStatusBadge(booking)}
                              <div>
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                  {t("your-payout")}
                                </p>
                                <p className="text-base font-semibold text-green-600">
                                  {currencySymbol}
                                  {(booking.partnerPayoutAmount ?? booking.totalAmount ?? 0).toFixed(2)}
                                </p>
                              </div>
                            </div>
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

                          {/* View Details Button */}
                          <div className="pt-2 border-t">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => setDetailBooking(booking)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              {t("view-details")}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={Boolean(detailBooking)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailBooking(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          {detailBooking && (
            <div className="space-y-6">
              <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    detailBooking.status === "canceled" ? "bg-destructive/10" : 
                    isBookingPassed(detailBooking.date, detailBooking.time) ? "bg-muted/10" : "bg-primary/10"
                  }`}>
                    <Car className={`w-6 h-6 ${
                      detailBooking.status === "canceled" ? "text-destructive" : 
                      isBookingPassed(detailBooking.date, detailBooking.time) ? "text-muted-foreground" : "text-primary"
                    }`} />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-gray-900">
                      {tRides("Trip")} #
                      {detailBooking.tripId.slice(0, 8)}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 mt-1">
                      {detailBooking.tripType === 'roundtrip' ? (
                        <>
                          {tRides("departure")}: {new Date(detailBooking.date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )} at {detailBooking.time}
                          {detailBooking.returnDate && (
                            <>
                              <br />
                              {tRides("return")}: {new Date(detailBooking.returnDate).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )} at {detailBooking.returnTime}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {tRides("ScheduledFor")}{" "}
                          {new Date(detailBooking.date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}{" "}
                          at {detailBooking.time}
                        </>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Journey Details */}
                <Card className="border border-border shadow-sm bg-background">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                      <Route className="w-5 h-5 text-primary" />
                      {tRides("JourneyDetails")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-secondary-foreground" />
                        <span className="font-medium text-gray-700">
                          {tRides("PickupLocation")}
                        </span>
                      </div>
                      <p className="text-gray-600 ml-6 p-2 bg-secondary/10 rounded-lg">
                        {detailBooking.pickup}
                      </p>
                    </div>

                    {detailBooking.stops && detailBooking.stops.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation className="w-4 h-4 text-secondary-foreground" />
                          <span className="font-medium text-gray-700">
                            {tRides("Stops")}
                          </span>
                        </div>
                        <div className="ml-6 space-y-2">
                          {detailBooking.stops
                            .sort((a, b) => a.order - b.order)
                            .map((stop, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between gap-2 text-sm text-gray-600 p-2 bg-secondary/10 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 bg-secondary/20 text-secondary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                                    {index + 1}
                                  </span>
                                  <span>{stop.location}</span>
                                </div>
                                {stop.duration && stop.duration > 0 && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {stop.duration >= 60 
                                      ? `${Math.floor(stop.duration / 60)}h${stop.duration % 60 > 0 ? ` ${stop.duration % 60}m` : ''}`
                                      : `${stop.duration}m`}
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-secondary-foreground" />
                        <span className="font-medium text-gray-700">
                          {tRides("DropoffLocation")}
                        </span>
                      </div>
                      <p className="text-gray-600 ml-6 p-2 bg-secondary/10 rounded-lg">
                        {detailBooking.dropoff ||
                          tRides("NotSpecified")}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays className="w-4 h-4 text-secondary-foreground" />
                        <div>
                          <p className="font-medium text-gray-700">
                            {detailBooking.tripType === 'roundtrip' ? tRides("DepartureDate") : tRides("Date")}
                          </p>
                          <p className="text-gray-600">{detailBooking.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-secondary-foreground" />
                        <div>
                          <p className="font-medium text-gray-700">
                            {detailBooking.tripType === 'roundtrip' ? tRides("DepartureTime") : tRides("Time")}
                          </p>
                          <p className="text-gray-600">{detailBooking.time}</p>
                        </div>
                      </div>
                    </div>

                    {detailBooking.tripType === 'roundtrip' && detailBooking.returnDate && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays className="w-4 h-4 text-secondary-foreground" />
                          <div>
                            <p className="font-medium text-gray-700">
                              {tRides("ReturnDate")}
                            </p>
                            <p className="text-gray-600">{detailBooking.returnDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-secondary-foreground" />
                          <div>
                            <p className="font-medium text-gray-700">
                              {tRides("ReturnTime")}
                            </p>
                            <p className="text-gray-600">{detailBooking.returnTime}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-secondary-foreground" />
                        <div>
                          <p className="font-medium text-gray-700">
                            {tRides("Passengers")}
                          </p>
                          <p className="text-gray-600">
                            {detailBooking.passengers}
                          </p>
                        </div>
                      </div>
                    </div>

                    {(detailBooking.childSeats > 0 ||
                      detailBooking.babySeats > 0) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-secondary/10 p-3 rounded-lg">
                        <Baby className="w-4 h-4" />
                        <span>
                          {detailBooking.childSeats > 0 &&
                            `${detailBooking.childSeats} Child Seat${detailBooking.childSeats > 1 ? 's' : ''}`}
                          {detailBooking.childSeats > 0 &&
                            detailBooking.babySeats > 0 &&
                            " • "}
                          {detailBooking.babySeats > 0 &&
                            `${detailBooking.babySeats} Baby Seat${detailBooking.babySeats > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card className="border border-border shadow-sm bg-background">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                      <UserCheck className="w-5 h-5 text-primary" />
                      {tRides("CustomerInformation")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
                      <User className="w-5 h-5 text-secondary-foreground" />
                      <p className="font-semibold text-gray-900 text-lg">
                        {detailBooking.firstName} {detailBooking.lastName}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm p-3 bg-secondary/10 rounded-lg">
                        <Mail className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                        <a
                          href={`mailto:${detailBooking.email}`}
                          className="text-primary hover:underline break-all"
                        >
                          {detailBooking.email}
                        </a>
                      </div>

                      <div className="flex items-center gap-3 text-sm p-3 bg-secondary/10 rounded-lg">
                        <PhoneCall className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                        <a
                          href={`tel:${detailBooking.phone}`}
                          className="text-primary hover:underline"
                        >
                          {detailBooking.phone}
                        </a>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Car className="w-4 h-4 text-secondary-foreground" />
                        {tRides("Vehicle")}
                      </p>
                      <p className="text-gray-600 p-2 bg-secondary/10 rounded-lg">
                        {detailBooking.vehicleDetails?.name}
                      </p>
                      {detailBooking.flightNumber && (
                        <div className="mt-3">
                          <p className="font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Plane className="w-4 h-4 text-secondary-foreground" />
                            {tRides('flight-number2')}
                          </p>
                          <p className="text-gray-600 p-2 bg-secondary/10 rounded-lg">
                            {detailBooking.flightNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Special Notes */}
              {detailBooking.notes && (
                <Card className="border border-border bg-secondary/10">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          {tRides("SpecialNotes")}
                        </p>
                        <p className="text-gray-700">{detailBooking.notes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Billing Information */}
              <Card className="border border-border shadow-sm bg-background">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                    <Receipt className="w-5 h-5 text-primary" />
                    {tRides("BillingAndPayment")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <DollarSign className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {tRides("TotalAmount")}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {currencySymbol}{detailBooking.totalAmount?.toFixed(2)}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <CreditCard className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {tRides("PaymentMethod")}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {detailBooking.paymentMethod?.replace("_", " ") ||
                          "N/A"}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <Clock className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {tRides("PaymentStatus")}
                      </p>
                      <div className="flex justify-center">
                        {getPaymentStatusBadge(detailBooking.paymentStatus)}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <Calendar className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {tRides("TripStatus")}
                      </p>
                      <div className="flex justify-center">
                        {getStatusBadge(detailBooking)}
                      </div>
                    </div>
                  </div>

                  {/* Cancellation/Refund Info */}
                  {(detailBooking.status === "canceled" ||
                    detailBooking.refundAmount) && (
                    <div className="mt-4 p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
                      {detailBooking.status === "canceled" &&
                        detailBooking.canceledAt && (
                          <div className="flex items-center gap-2 text-gray-700 mb-2">
                            <Ban className="w-4 h-4" />
                            <span className="font-medium">
                              {tRides("CanceledOn")}{" "}
                              {new Date(
                                detailBooking.canceledAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                      {detailBooking.refundAmount &&
                        detailBooking.refundAmount > 0 && (
                          <div className="flex items-center justify-between text-gray-700">
                            <span className="flex items-center gap-2">
                              <RefreshCw className="w-4 h-4" />
                              {tRides("RefundProcessed")}
                            </span>
                            <span className="font-bold">
                              {currencySymbol}{detailBooking.refundAmount.toFixed(2)}
                              {detailBooking.refundPercentage && (
                                <span className="text-sm font-normal ml-1">
                                  ({detailBooking.refundPercentage}%)
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
