"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Percent,
  AlertTriangle,
} from "lucide-react";
import { IBooking } from "@/models/Booking";
import { apiGet, apiPatch } from "@/utils/api";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

export default function RidesPage() {
  const t = useTranslations();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<IBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<IBooking | null>(null);
  const [refundPercentage, setRefundPercentage] = useState(100);
  const [detailBooking, setDetailBooking] = useState<IBooking | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
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
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, activeTab, searchQuery, paymentFilter, dateRange]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<{ success: boolean; data: IBooking[] }>("/api/bookings");
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = useMemo(() => {
    return () => {
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
            (booking.dropoff &&
              booking.dropoff.toLowerCase().includes(query)) ||
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

      // Apply payment filter
      if (paymentFilter !== "all") {
        filtered = filtered.filter(
          (booking) => booking.paymentStatus === paymentFilter
        );
      }

      setFilteredBookings(filtered);
    };
  }, [bookings, activeTab, searchQuery, paymentFilter, dateRange]);

  const handleCancelClick = (booking: IBooking) => {
    setSelectedBooking(booking);
    setRefundPercentage(100);
    setShowCancelDialog(true);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking?._id) return;

    setCancelingId(selectedBooking._id.toString());
    try {
      const data = await apiPatch<{ success: boolean; message: string; data: IBooking }>(`/api/bookings/${selectedBooking._id}`, {
        action: "cancel",
        refundPercentage: refundPercentage,
      });

      if (data.success) {
        // Update local state
        setBookings((prev) =>
          prev.map((b) =>
            b._id?.toString() === selectedBooking._id?.toString()
              ? data.data
              : b
          )
        );
        setShowCancelDialog(false);
        setSelectedBooking(null);
      } else {
        alert(`${t("Dashboard.Rides.CancelError")}: ${data.message}`);
      }
    } catch (error) {
      console.error("Error canceling booking:", error);
      alert(t("Dashboard.Rides.CancelBookingError"));
    } finally {
      setCancelingId(null);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const badgeClasses =
      "text-white font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full text-xs";
    switch (status) {
      case "completed":
        return (
          <Badge className={`${badgeClasses} bg-green-600 hover:bg-green-700`}>
            <CheckCircle className="w-3 h-3" /> {t("Dashboard.Rides.Paid")}
          </Badge>
        );
      case "pending":
        return (
          <Badge
            className={`${badgeClasses} bg-amber-600 hover:bg-amber-700`}
          >
            <Clock className="w-3 h-3" /> {t("Dashboard.Rides.Pending")}
          </Badge>
        );
      case "refunded":
        return (
          <Badge className={`${badgeClasses} bg-blue-600 hover:bg-blue-700`}>
            <RefreshCw className="w-3 h-3" /> {t("Dashboard.Rides.Refunded")}
          </Badge>
        );
      case "failed":
        return (
          <Badge className={`${badgeClasses} bg-red-600 hover:bg-red-700`}>
            <X className="w-3 h-3" /> {t("Dashboard.Rides.Failed")}
          </Badge>
        );
      default:
        return (
          <Badge className={`${badgeClasses} bg-gray-600`}>{status}</Badge>
        );
    }
  };

  const getStatusBadge = (booking: IBooking) => {
    const badgeClasses =
      "text-white font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full text-xs";
    if (booking.status === "canceled") {
      return (
        <Badge className={`${badgeClasses} bg-red-600 hover:bg-red-700`}>
          <X className="w-3 h-3" /> {t("Dashboard.Rides.Canceled")}
        </Badge>
      );
    }

    const bookingDate = new Date(booking.date);
    const now = new Date();

    if (bookingDate < now) {
      return (
        <Badge className={`${badgeClasses} bg-gray-600 hover:bg-gray-700`}>
          <CheckCircle className="w-3 h-3" /> {t("Dashboard.Rides.Completed")}
        </Badge>
      );
    }

    return (
      <Badge className={`${badgeClasses} bg-blue-600 hover:bg-blue-700`}>
        <Calendar className="w-3 h-3" /> {t("Dashboard.Rides.Upcoming")}
      </Badge>
    );
  };

  const canRefund = (booking: IBooking) => {
    return (
      booking.paymentStatus === "completed" &&
      booking.paymentMethod &&
      ["stripe", "bank_transfer"].includes(booking.paymentMethod) &&
      booking.status !== "canceled"
    );
  };

  const BookingCard = ({ booking }: { booking: IBooking }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border border-gray-200 shadow-sm bg-white overflow-hidden">
      <div className="h-1 bg-blue-600"></div>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  {t("Dashboard.Rides.Trip")} #{booking.tripId.slice(0, 8)}
                </h3>
                <p className="text-sm text-gray-500">
                  {booking.vehicleDetails?.name || booking.selectedVehicle}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {getStatusBadge(booking)}
              {getPaymentStatusBadge(booking.paymentStatus)}
            </div>
          </div>

          {/* Trip Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CalendarDays className="w-3 h-3" />
                {t("Dashboard.Rides.Date")}
              </div>
              <p className="text-sm font-medium text-gray-900">
                {new Date(booking.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {t("Dashboard.Rides.Time")}
              </div>
              <p className="text-sm font-medium text-gray-900">{booking.time}</p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                {t("Dashboard.Rides.Passengers")}
              </div>
              <p className="text-sm font-medium text-gray-900">{booking.passengers}</p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <DollarSign className="w-3 h-3" />
                {t("Dashboard.Rides.Price")}
              </div>
              <p className="text-sm font-medium text-gray-900">€{booking.totalAmount?.toFixed(2)}</p>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">Passengers:</span>
                <span className="font-medium text-gray-900">{booking.passengers}</span>
              </div>
              {booking.childSeats > 0 && (
                <div className="flex items-center gap-2">
                  <Baby className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">Child Seats:</span>
                  <span className="font-medium text-gray-900">{booking.childSeats}</span>
                </div>
              )}
              {booking.babySeats > 0 && (
                <div className="flex items-center gap-2">
                  <Baby className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">Baby Seats:</span>
                  <span className="font-medium text-gray-900">{booking.babySeats}</span>
                </div>
              )}
              {booking.flightNumber && (
                <div className="flex items-center gap-2">
                  <Plane className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">Flight Number:</span>
                  <span className="font-medium text-gray-900">{booking.flightNumber}</span>
                </div>
              )}
            </div>
            {booking.notes && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                <div className="flex items-start gap-2">
                  <Info className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-gray-700">Special Requests:</span>
                    <p className="text-xs text-gray-600 mt-1">{booking.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Route Information */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Route className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 font-medium">{t("Dashboard.Rides.Route")}:</span>
              {booking.stops && booking.stops.length > 0 ? (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="max-w-[6rem] truncate" title={booking.pickup}>
                    {booking.pickup}
                  </span>
                  {booking.stops
                    .sort((a, b) => a.order - b.order)
                    .map((stop, index) => (
                      <React.Fragment key={index}>
                        <ChevronRight className="h-3 w-3 text-gray-400" />
                        <span className="max-w-[6rem] truncate" title={stop.location}>
                          {stop.location}
                        </span>
                      </React.Fragment>
                    ))}
                  {booking.dropoff && (
                    <>
                      <ChevronRight className="h-3 w-3 text-gray-400" />
                      <span className="max-w-[6rem] truncate" title={booking.dropoff}>
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                {booking.firstName} {booking.lastName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 truncate max-w-32">
                {booking.email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">{booking.phone}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailBooking(booking)}
              className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            >
              <Eye className="w-4 h-4" />
              {t("Dashboard.Rides.ViewDetails")}
            </Button>

            {booking.status !== "canceled" && new Date(booking.date) >= new Date() && (
              <Button
                onClick={() => handleCancelClick(booking)}
                variant="destructive"
                size="sm"
                disabled={cancelingId === booking._id?.toString()}
                className="flex items-center gap-2"
              >
                {cancelingId === booking._id?.toString() ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("Dashboard.Rides.Canceling")}
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    {t("Dashboard.Rides.Cancel")}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Car className="w-8 h-8 text-blue-600" />
                {t("Dashboard.Rides.Title")}
              </h1>
              <p className="text-gray-500 mt-1">
                {t("Dashboard.Rides.Description")}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={fetchBookings}
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
          <Card className="p-4 border border-gray-200 shadow-sm bg-white">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-500" />
                  {t("Dashboard.Rides.FilterBookings")}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-gray-600"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? t("Dashboard.Rides.HideFilters") : t("Dashboard.Rides.ShowFilters")}
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t("Dashboard.Rides.SearchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              
              {showFilters && (
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <DateRangePicker
                    date={dateRange}
                    onDateChange={setDateRange}
                    className="flex-1 sm:w-auto"
                  />

                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="flex-1 sm:w-48">
                      <CreditCard className="w-4 h-4 mr-2" />
                      <SelectValue placeholder={t("Dashboard.Rides.Payment")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("Dashboard.Rides.AllPayments")}
                      </SelectItem>
                      <SelectItem value="completed">
                        {t("Dashboard.Rides.Paid")}
                      </SelectItem>
                      <SelectItem value="pending">
                        {t("Dashboard.Rides.Pending")}
                      </SelectItem>
                      <SelectItem value="failed">
                        {t("Dashboard.Rides.Failed")}
                      </SelectItem>
                      <SelectItem value="refunded">
                        {t("Dashboard.Rides.Refunded")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-white p-1 rounded-lg border border-gray-200 shadow-sm h-auto">
            <TabsTrigger
              value="upcoming"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <CalendarDays className="w-4 h-4" />
              <span className="font-medium">
                {t("Dashboard.Rides.UpcomingRides")}
              </span>
              {filteredBookings.length > 0 && activeTab === "upcoming" && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-blue-100 text-blue-600"
                >
                  {filteredBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="passed"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all data-[state=active]:bg-gray-100 data-[state=active]:text-gray-700 data-[state=active]:shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">
                {t("Dashboard.Rides.CompletedRides")}
              </span>
              {filteredBookings.length > 0 && activeTab === "passed" && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-gray-100 text-gray-700"
                >
                  {filteredBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="canceled"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all data-[state=active]:bg-red-50 data-[state=active]:text-red-600 data-[state=active]:shadow-sm"
            >
              <Ban className="w-4 h-4" />
              <span className="font-medium">
                {t("Dashboard.Rides.CanceledRides")}
              </span>
              {filteredBookings.length > 0 && activeTab === "canceled" && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-red-100 text-red-600"
                >
                  {filteredBookings.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("Dashboard.Rides.LoadingRides")}
                </h3>
                <p className="text-gray-500">
                  {t("Dashboard.Rides.LoadingRidesDescription")}
                </p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-200 bg-white">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CalendarDays className="w-10 h-10 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {t("Dashboard.Rides.NoUpcomingRides")}
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {t("Dashboard.Rides.NoUpcomingRidesDescription")}
                  </p>
                  <Button
                    onClick={fetchBookings}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t("Dashboard.Rides.Refresh")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredBookings.map((booking) => (
                  <BookingCard
                    key={booking._id?.toString()}
                    booking={booking}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="passed" className="mt-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("Dashboard.Rides.LoadingRides")}
                </h3>
                <p className="text-gray-500">
                  {t("Dashboard.Rides.LoadingRidesDescription")}
                </p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-200 bg-white">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {t("Dashboard.Rides.NoCompletedRides")}
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {t("Dashboard.Rides.NoCompletedRidesDescription")}
                  </p>
                  <Button
                    onClick={fetchBookings}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t("Dashboard.Rides.Refresh")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredBookings.map((booking) => (
                  <BookingCard
                    key={booking._id?.toString()}
                    booking={booking}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="canceled" className="mt-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("Dashboard.Rides.LoadingRides")}
                </h3>
                <p className="text-gray-500">
                  {t("Dashboard.Rides.LoadingRidesDescription")}
                </p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-200 bg-white">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Ban className="w-10 h-10 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {t("Dashboard.Rides.NoCanceledRides")}
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {t("Dashboard.Rides.NoCanceledRidesDescription")}
                  </p>
                  <Button
                    onClick={fetchBookings}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t("Dashboard.Rides.Refresh")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredBookings.map((booking) => (
                  <BookingCard
                    key={booking._id?.toString()}
                    booking={booking}
                  />
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
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Car className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-bold text-gray-900">
                        {t("Dashboard.Rides.Trip")} #{detailBooking.tripId.slice(0, 8)}
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
                  <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                        <Route className="w-5 h-5 text-blue-600" />
                        {t("Dashboard.Rides.JourneyDetails")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-700">
                            {t("Dashboard.Rides.PickupLocation")}
                          </span>
                        </div>
                        <p className="text-gray-600 ml-6 p-2 bg-gray-50 rounded-lg">{detailBooking.pickup}</p>
                      </div>

                      {detailBooking.stops && detailBooking.stops.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Navigation className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-700">
                              {t("Dashboard.Rides.Stops")}
                            </span>
                          </div>
                          <div className="ml-6 space-y-2">
                            {detailBooking.stops
                              .sort((a, b) => a.order - b.order)
                              .map((stop, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">
                                  <span className="w-6 h-6 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-xs font-medium">
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
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-700">
                            {t("Dashboard.Rides.DropoffLocation")}
                          </span>
                        </div>
                        <p className="text-gray-600 ml-6 p-2 bg-gray-50 rounded-lg">
                          {detailBooking.dropoff || t("Dashboard.Rides.NotSpecified")}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-700">
                              {t("Dashboard.Rides.Time")}
                            </p>
                            <p className="text-gray-600">{detailBooking.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-700">
                              {t("Dashboard.Rides.Passengers")}
                            </p>
                            <p className="text-gray-600">{detailBooking.passengers}</p>
                          </div>
                        </div>
                      </div>

                      {(detailBooking.childSeats > 0 ||
                        detailBooking.babySeats > 0) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <Baby className="w-4 h-4" />
                          <span>
                            {detailBooking.childSeats > 0 &&
                              `${detailBooking.childSeats} child seat${detailBooking.childSeats > 1 ? "s" : ""}`}
                            {detailBooking.childSeats > 0 &&
                              detailBooking.babySeats > 0 &&
                              " • "}
                            {detailBooking.babySeats > 0 &&
                              `${detailBooking.babySeats} baby seat${detailBooking.babySeats > 1 ? "s" : ""}`}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Customer Information */}
                  <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                        {t("Dashboard.Rides.CustomerInformation")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <User className="w-5 h-5 text-gray-500" />
                        <p className="font-semibold text-gray-900 text-lg">
                          {detailBooking.firstName} {detailBooking.lastName}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg">
                          <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <a
                            href={`mailto:${detailBooking.email}`}
                            className="text-blue-600 hover:underline break-all"
                          >
                            {detailBooking.email}
                          </a>
                        </div>

                        <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg">
                          <PhoneCall className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <a
                            href={`tel:${detailBooking.phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {detailBooking.phone}
                          </a>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Car className="w-4 h-4 text-gray-500" />
                          {t("Dashboard.Rides.Vehicle")}
                        </p>
                        <p className="text-gray-600 p-2 bg-gray-50 rounded-lg">
                          {detailBooking.vehicleDetails?.name ||
                            detailBooking.selectedVehicle}
                        </p>
                        {detailBooking.flightNumber && (
                          <div className="mt-3">
                            <p className="font-medium text-gray-700 mb-1 flex items-center gap-2">
                              <Plane className="w-4 h-4 text-gray-500" />
                              Flight Number
                            </p>
                            <p className="text-gray-600 p-2 bg-gray-50 rounded-lg">{detailBooking.flightNumber}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Special Notes */}
                {detailBooking.notes && (
                  <Card className="border border-gray-200 bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
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
                <Card className="border border-gray-200 shadow-sm bg-white">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                      <Receipt className="w-5 h-5 text-blue-600" />
                      {t("Dashboard.Rides.BillingAndPayment")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <DollarSign className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-1">
                          {t("Dashboard.Rides.TotalAmount")}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          €{detailBooking.totalAmount?.toFixed(2)}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <CreditCard className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-1">
                          {t("Dashboard.Rides.PaymentMethod")}
                        </p>
                        <p className="text-lg font-semibold text-gray-900 capitalize">
                          {detailBooking.paymentMethod?.replace("_", " ") || "N/A"}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Clock className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-1">
                          {t("Dashboard.Rides.PaymentStatus")}
                        </p>
                        <div className="flex justify-center">
                          {getPaymentStatusBadge(detailBooking.paymentStatus)}
                        </div>
                      </div>

                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Calendar className="w-6 h-6 text-gray-500 mx-auto mb-2" />
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
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
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
                                €{detailBooking.refundAmount.toFixed(2)}
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

        {/* Cancel/Refund Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <div className="p-2 bg-red-50 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                {t("Dashboard.Rides.CancelRideAndProcessRefund")}
              </DialogTitle>
              <DialogDescription className="text-base pt-2">
                <span className="font-semibold">
                  {t("Dashboard.Rides.Trip")} #{selectedBooking?.tripId.slice(0, 8)}
                </span>
                <span className="text-gray-500 mx-2">•</span>
                <span>
                  {selectedBooking?.firstName} {selectedBooking?.lastName}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-gray-50 border-l-4 border-gray-400 rounded-r-lg p-4">
                <p className="text-sm text-gray-700 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold block mb-1">
                      {t("Dashboard.Rides.WarningThisActionCannotBeUndone")}
                    </span>
                    {t("Dashboard.Rides.ThisWillPermanentlyCancelTheRide")}.{" "}
                    {selectedBooking &&
                      canRefund(selectedBooking) &&
                      t("Dashboard.Rides.ARefundWillBeProcessedAutomaticallyToTheCustomer")}
                  </span>
                </p>
              </div>

              {selectedBooking && canRefund(selectedBooking) && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                  <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-blue-600" />
                    {t("Dashboard.Rides.RefundPercentage")}
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={refundPercentage}
                      onChange={(e) =>
                        setRefundPercentage(
                          Math.min(
                            100,
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        )
                      }
                      className="w-24 text-center font-bold text-lg"
                    />
                    <span className="text-lg font-semibold text-gray-600">
                      %
                    </span>
                    <div className="flex-1">
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={refundPercentage}
                        onChange={(e) =>
                          setRefundPercentage(parseInt(e.target.value))
                        }
                        className="w-full cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 flex items-center gap-1">
                        <RefreshCw className="w-4 h-4" />
                        {t("Dashboard.Rides.RefundAmount")}
                      </span>
                      <span className="font-bold text-xl text-gray-900">
                        €
                        {(
                          (selectedBooking?.totalAmount || 0) *
                          (refundPercentage / 100)
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                      <span>{t("Dashboard.Rides.TotalAmount")}</span>
                      <span>€{selectedBooking?.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedBooking?.paymentMethod === "cash" && (
                <div className="bg-gray-50 border-l-4 border-gray-400 rounded-r-lg p-4">
                  <p className="text-sm text-gray-700 flex items-start gap-2">
                    <CreditCard className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>
                      <span className="font-semibold block mb-1">
                        {t("Dashboard.Rides.CashPayment")}
                      </span>
                      {t("Dashboard.Rides.PaymentMethodIsCashNoOnlineRefundWillBeProcessedYouMayNeedToHandleTheRefundManually")}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                className="w-full sm:w-auto"
              >
                {t("Dashboard.Rides.KeepRide")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelBooking}
                disabled={cancelingId !== null}
                className="w-full sm:w-auto"
              >
                {cancelingId ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("Dashboard.Rides.Processing")}
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4 mr-2" />
                    {t("Dashboard.Rides.ConfirmCancellation")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}