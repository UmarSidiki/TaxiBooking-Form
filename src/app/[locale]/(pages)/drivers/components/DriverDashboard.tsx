"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Mail,
  Car,
  Users,
  CreditCard,
  Loader2,
  X,
  CheckCircle,
  RefreshCw,
  DollarSign,
  Baby,
  Search,
  MapPin,
  Navigation,
  CalendarDays,
  PhoneCall,
  UserCheck,
  Ban,
  Eye,
  Filter,
  Plane,
  Info,
  ChevronRight,
  Route,
  User,
  Receipt,
} from "lucide-react";
import type { IBooking } from "@/models/Booking";
import { apiGet } from "@/utils/api";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function DriverDashboard() {
  const t = useTranslations();
  const { currencySymbol } = useCurrency();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<IBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [detailBooking, setDetailBooking] = useState<IBooking | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const MapLine = ({ start, end }: { start: string; end: string }) => (
    <span className="flex items-center gap-1 truncate">
      <span className="max-w-[6rem] truncate" title={start}>
        {start}
      </span>
      <ChevronRight className="h-3 w-3 text-gray-400" />
      <span className="max-w-[6rem] truncate" title={end}>
        {end}
      </span>
    </span>
  );

  useEffect(() => {
    fetchAssignedRides();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, activeTab, searchQuery, dateRange]);

  const fetchAssignedRides = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<{ success: boolean; data: IBooking[] }>(
        "/api/drivers/rides"
      );
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error("Error fetching assigned rides:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered: IBooking[] = [];

    // First filter by tab
    switch (activeTab) {
      case "upcoming":
        filtered = bookings.filter((b) => {
          if (b.status === "canceled") return false;
          const bookingDate = new Date(b.date);
          return bookingDate >= new Date();
        });
        break;
      case "passed":
        filtered = bookings.filter((b) => {
          if (b.status === "canceled") return false;
          const bookingDate = new Date(b.date);
          return bookingDate < new Date();
        });
        break;
      case "canceled":
        filtered = bookings.filter((b) => b.status === "canceled");
        break;
      default:
        filtered = bookings;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.tripId.toLowerCase().includes(query) ||
          booking.firstName.toLowerCase().includes(query) ||
          booking.lastName.toLowerCase().includes(query) ||
          booking.email.toLowerCase().includes(query) ||
          booking.phone.includes(query) ||
          booking.pickup.toLowerCase().includes(query) ||
          (booking.dropoff && booking.dropoff.toLowerCase().includes(query)) ||
          (booking.vehicleDetails?.name &&
            booking.vehicleDetails.name.toLowerCase().includes(query))
      );
    }

    // Apply date filter
    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter((booking) => {
        const bookingDate = new Date(booking.date);
        const fromDate = dateRange.from;
        const toDate = dateRange.to;

        if (fromDate && bookingDate < fromDate) return false;
        if (toDate && bookingDate > toDate) return false;
        return true;
      });
    }

    setFilteredBookings(filtered);
  };

  const getStatusBadge = (booking: IBooking) => {
    const badgeClasses =
      "text-white font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full text-xs";
    if (booking.status === "canceled") {
      return (
        <Badge
          className={`${badgeClasses} bg-destructive hover:bg-destructive/90`}
        >
          <X className="w-3 h-3" /> {t("Dashboard.Rides.Canceled")}
        </Badge>
      );
    }

    const bookingDate = new Date(booking.date);
    const now = new Date();

    if (bookingDate < now) {
      return (
        <Badge
          className={`${badgeClasses} bg-muted hover:bg-muted/90 text-muted-foreground`}
        >
          <CheckCircle className="w-3 h-3" /> {t("Dashboard.Rides.Completed")}
        </Badge>
      );
    }

    return (
      <Badge className={`${badgeClasses} bg-primary hover:bg-primary/90`}>
        <Calendar className="w-3 h-3" /> {t("Dashboard.Rides.Upcoming")}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const badgeClasses =
      "text-white font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full text-xs";
    switch (status) {
      case "completed":
        return (
          <Badge className={`${badgeClasses} bg-primary hover:bg-primary/90`}>
            <CheckCircle className="w-3 h-3" /> {t("Dashboard.Rides.Paid")}
          </Badge>
        );
      case "pending":
        return (
          <Badge
            className={`${badgeClasses} bg-secondary hover:bg-secondary/90`}
          >
            <Clock className="w-3 h-3" /> {t("Dashboard.Rides.Pending")}
          </Badge>
        );
      case "refunded":
        return (
          <Badge className={`${badgeClasses} bg-primary hover:bg-primary/90`}>
            <RefreshCw className="w-3 h-3" /> {t("Dashboard.Rides.Refunded")}
          </Badge>
        );
      case "failed":
        return (
          <Badge
            className={`${badgeClasses} bg-destructive hover:bg-destructive/90`}
          >
            <X className="w-3 h-3" /> {t("Dashboard.Rides.Failed")}
          </Badge>
        );
      default:
        return (
          <Badge
            className={`${badgeClasses} bg-muted hover:bg-muted/90 text-muted-foreground`}
          >
            {status}
          </Badge>
        );
    }
  };

  const BookingCard = ({ booking }: { booking: IBooking }) => {
    const getStatusColor = () => {
      if (booking.status === "canceled") return "destructive";
      if (new Date(booking.date) < new Date()) return "muted";
      return "primary";
    };

    const statusColor = getStatusColor();

    return (
      <Card className="group hover:shadow-lg transition-all duration-300 border border-gray-200 shadow-sm bg-white overflow-hidden">
        {/* Top border indicator */}
        <div
          className={`h-1 ${
            statusColor === "destructive"
              ? "bg-destructive"
              : statusColor === "muted"
              ? "bg-muted"
              : "bg-primary"
          }`}
        ></div>

        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    statusColor === "destructive"
                      ? "bg-destructive/10"
                      : statusColor === "muted"
                      ? "bg-muted/10"
                      : "bg-primary/10"
                  }`}
                >
                  <Car
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      statusColor === "destructive"
                        ? "text-destructive"
                        : statusColor === "muted"
                        ? "text-muted-foreground"
                        : "text-primary"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                    {t("Dashboard.Rides.Trip")} #{booking.tripId.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {booking.vehicleDetails?.name || booking.selectedVehicle}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row self-start sm:self-auto">
                {getStatusBadge(booking)}
              </div>
            </div>

            {/* Trip Details Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
                  <CalendarDays className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{t("Dashboard.Rides.Date")}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {new Date(booking.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{t("Dashboard.Rides.Time")}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {booking.time}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
                  <Users className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {t("Dashboard.Rides.Passengers")}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {booking.passengers}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
                  <DollarSign className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{t("Dashboard.Rides.Price")}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currencySymbol}{booking.totalAmount?.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">Passengers:</span>
                  <span className="font-medium text-gray-900">
                    {booking.passengers}
                  </span>
                </div>
                {booking.childSeats > 0 && (
                  <div className="flex items-center gap-2">
                    <Baby className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">
                      {t("Drivers.child-seats")}
                    </span>
                    <span className="font-medium text-gray-900">
                      {booking.childSeats}
                    </span>
                  </div>
                )}
                {booking.babySeats > 0 && (
                  <div className="flex items-center gap-2">
                    <Baby className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">
                      {t("Drivers.baby-seats")}
                    </span>
                    <span className="font-medium text-gray-900">
                      {booking.babySeats}
                    </span>
                  </div>
                )}
                {booking.flightNumber && (
                  <div className="flex items-center gap-2">
                    <Plane className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">
                      {t("Drivers.flight-number")}
                    </span>
                    <span className="font-medium text-gray-900">
                      {booking.flightNumber}
                    </span>
                  </div>
                )}
              </div>
              {booking.notes && (
                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-2">
                  <div className="flex items-start gap-2">
                    <Info className="w-3 h-3 text-secondary-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-secondary-foreground">
                        {t("Drivers.special-requests")}{" "}
                      </span>
                      <p className="text-xs text-secondary-foreground mt-1">
                        {booking.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Route Information */}
            <div className="bg-secondary/10 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Route className="w-4 h-4 text-secondary-foreground" />
                <span className="text-secondary-foreground font-medium">
                  {t("Dashboard.Rides.Route")}:
                </span>
                {booking.stops && booking.stops.length > 0 ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span
                      className="max-w-[6rem] truncate"
                      title={booking.pickup}
                    >
                      {booking.pickup}
                    </span>
                    {booking.stops
                      .sort((a, b) => a.order - b.order)
                      .map((stop, index) => (
                        <React.Fragment key={index}>
                          <ChevronRight className="h-3 w-3 text-secondary-foreground/50" />
                          <span
                            className="max-w-[6rem] truncate"
                            title={stop.location}
                          >
                            {stop.location}
                          </span>
                        </React.Fragment>
                      ))}
                    {booking.dropoff && (
                      <>
                        <ChevronRight className="h-3 w-3 text-secondary-foreground/50" />
                        <span
                          className="max-w-[6rem] truncate"
                          title={booking.dropoff}
                        >
                          {booking.dropoff}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <MapLine
                    start={booking.pickup}
                    end={booking.dropoff || "N/A"}
                  />
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                <span className="text-gray-700 truncate">
                  {booking.firstName} {booking.lastName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                <span className="text-gray-700 truncate">{booking.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                <span className="text-gray-700 truncate">{booking.phone}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailBooking(booking)}
                className="flex items-center justify-center gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-sm"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                {t("Dashboard.Rides.ViewDetails")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t("Dashboard.Rides.LoadingRides")}
        </h3>
        <p className="text-gray-500">
          {t("Dashboard.Rides.LoadingRidesDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Car className="w-8 h-8 text-primary" />
              {t("Dashboard.Rides.Title")}
            </h1>
            <p className="text-gray-500 mt-1">
              {t("Dashboard.Rides.Description")}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={fetchAssignedRides}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              {t("Dashboard.Rides.Refresh")}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-3 sm:p-4 border border-gray-200 shadow-sm bg-white">
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-foreground" />
                {t("Dashboard.Rides.FilterBookings")}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-secondary-foreground text-sm"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                {showFilters
                  ? t("Dashboard.Rides.HideFilters")
                  : t("Dashboard.Rides.ShowFilters")}
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-foreground w-4 h-4" />
              <Input
                placeholder={t("Dashboard.Rides.SearchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 sm:h-10 text-sm"
              />
            </div>

            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <DateRangePicker
                  date={dateRange}
                  onDateChange={setDateRange}
                  className="flex-1 sm:w-auto"
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-background p-1 rounded-lg border border-border shadow-sm h-auto">
          <TabsTrigger
            value="upcoming"
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-xs sm:text-sm"
          >
            <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="font-medium text-center">
              {t("Dashboard.Rides.UpcomingRides")}
            </span>
            {filteredBookings.length > 0 && activeTab === "upcoming" && (
              <Badge
                variant="secondary"
                className="ml-0 sm:ml-1 bg-primary/20 text-primary text-xs"
              >
                {filteredBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="passed"
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md transition-all data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:shadow-sm text-xs sm:text-sm"
          >
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="font-medium text-center">
              {t("Dashboard.Rides.CompletedRides")}
            </span>
            {filteredBookings.length > 0 && activeTab === "passed" && (
              <Badge
                variant="secondary"
                className="ml-0 sm:ml-1 bg-secondary/20 text-secondary-foreground text-xs"
              >
                {filteredBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="canceled"
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md transition-all data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground data-[state=active]:shadow-sm text-xs sm:text-sm"
          >
            <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="font-medium text-center">
              {t("Dashboard.Rides.CanceledRides")}
            </span>
            {filteredBookings.length > 0 && activeTab === "canceled" && (
              <Badge
                variant="secondary"
                className="ml-0 sm:ml-1 bg-destructive/20 text-destructive text-xs"
              >
                {filteredBookings.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("Dashboard.Rides.LoadingRides")}
              </h3>
              <p className="text-gray-500">
                {t("Dashboard.Rides.LoadingRidesDescription")}
              </p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <Card className="border-2 border-dashed border-border bg-background">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CalendarDays className="w-10 h-10 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t("Dashboard.Rides.NoUpcomingRides")}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {t("Dashboard.Rides.NoUpcomingRidesDescription")}
                </p>
                <Button
                  onClick={fetchAssignedRides}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t("Dashboard.Rides.Refresh")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
              {filteredBookings.map((booking) => (
                <BookingCard key={booking._id?.toString()} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="passed" className="mt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-secondary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("Dashboard.Rides.LoadingRides")}
              </h3>
              <p className="text-gray-500">
                {t("Dashboard.Rides.LoadingRidesDescription")}
              </p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <Card className="border-2 border-dashed border-border bg-background">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t("Dashboard.Rides.NoCompletedRides")}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {t("Dashboard.Rides.NoCompletedRidesDescription")}
                </p>
                <Button
                  onClick={fetchAssignedRides}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t("Dashboard.Rides.Refresh")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
              {filteredBookings.map((booking) => (
                <BookingCard key={booking._id?.toString()} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="canceled" className="mt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("Dashboard.Rides.LoadingRides")}
              </h3>
              <p className="text-gray-500">
                {t("Dashboard.Rides.LoadingRidesDescription")}
              </p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <Card className="border-2 border-dashed border-border bg-background">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Ban className="w-10 h-10 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t("Dashboard.Rides.NoCanceledRides")}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {t("Dashboard.Rides.NoCanceledRidesDescription")}
                </p>
                <Button
                  onClick={fetchAssignedRides}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t("Dashboard.Rides.Refresh")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
              {filteredBookings.map((booking) => (
                <BookingCard key={booking._id?.toString()} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
                  <div
                    className={`p-3 rounded-lg ${
                      detailBooking.status === "canceled"
                        ? "bg-destructive/10"
                        : new Date(detailBooking.date) < new Date()
                        ? "bg-muted/10"
                        : "bg-primary/10"
                    }`}
                  >
                    <Car
                      className={`w-6 h-6 ${
                        detailBooking.status === "canceled"
                          ? "text-destructive"
                          : new Date(detailBooking.date) < new Date()
                          ? "text-muted-foreground"
                          : "text-primary"
                      }`}
                    />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-gray-900">
                      {t("Dashboard.Rides.Trip")} #
                      {detailBooking.tripId.slice(0, 8)}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 mt-1">
                      {t("Dashboard.Rides.ScheduledFor")}{" "}
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
                      {t("Dashboard.Rides.JourneyDetails")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-secondary-foreground" />
                        <span className="font-medium text-gray-700">
                          {t("Dashboard.Rides.PickupLocation")}
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
                            {t("Dashboard.Rides.Stops")}
                          </span>
                        </div>
                        <div className="ml-6 space-y-2">
                          {detailBooking.stops
                            .sort((a, b) => a.order - b.order)
                            .map((stop, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-secondary/10 rounded-lg"
                              >
                                <span className="w-6 h-6 bg-secondary/20 text-secondary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </span>
                                <span>{stop.location}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-secondary-foreground" />
                        <span className="font-medium text-gray-700">
                          {t("Dashboard.Rides.DropoffLocation")}
                        </span>
                      </div>
                      <p className="text-gray-600 ml-6 p-2 bg-secondary/10 rounded-lg">
                        {detailBooking.dropoff ||
                          t("Dashboard.Rides.NotSpecified")}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-secondary-foreground" />
                        <div>
                          <p className="font-medium text-gray-700">
                            {t("Dashboard.Rides.Time")}
                          </p>
                          <p className="text-gray-600">{detailBooking.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-secondary-foreground" />
                        <div>
                          <p className="font-medium text-gray-700">
                            {t("Dashboard.Rides.Passengers")}
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
                            t(
                              "Drivers.detailbooking-childseats-child-seat-detailbooking-childseats-greater-than-1-s",
                              {
                                0: detailBooking.childSeats,
                                1: detailBooking.childSeats > 1 ? "s" : "",
                              }
                            )}
                          {detailBooking.childSeats > 0 &&
                            detailBooking.babySeats > 0 &&
                            " • "}
                          {detailBooking.babySeats > 0 &&
                            t(
                              "Drivers.detailbooking-babyseats-baby-seat-detailbooking-babyseats-greater-than-1-s",
                              {
                                0: detailBooking.babySeats,
                                1: detailBooking.babySeats > 1 ? "s" : "",
                              }
                            )}
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
                      {t("Dashboard.Rides.CustomerInformation")}
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
                        {t("Dashboard.Rides.Vehicle")}
                      </p>
                      <p className="text-gray-600 p-2 bg-secondary/10 rounded-lg">
                        {detailBooking.vehicleDetails?.name ||
                          detailBooking.selectedVehicle}
                      </p>
                      {detailBooking.flightNumber && (
                        <div className="mt-3">
                          <p className="font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Plane className="w-4 h-4 text-secondary-foreground" />
                            {t("Drivers.flight-number")}{" "}
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
                          {t("Dashboard.Rides.SpecialNotes")}
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
                    {t("Dashboard.Rides.BillingAndPayment")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <DollarSign className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {t("Dashboard.Rides.TotalAmount")}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {currencySymbol}{detailBooking.totalAmount?.toFixed(2)}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <CreditCard className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {t("Dashboard.Rides.PaymentMethod")}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {detailBooking.paymentMethod?.replace("_", " ") ||
                          "N/A"}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <Clock className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {t("Dashboard.Rides.PaymentStatus")}
                      </p>
                      <div className="flex justify-center">
                        {getPaymentStatusBadge(detailBooking.paymentStatus)}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <Calendar className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {t("Dashboard.Rides.TripStatus")}
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
                              {t("Dashboard.Rides.CanceledOn")}{" "}
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
                              {t("Dashboard.Rides.RefundProcessed")}
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
