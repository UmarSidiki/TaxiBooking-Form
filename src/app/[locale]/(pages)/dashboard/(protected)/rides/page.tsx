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
  AlertCircle,
  RefreshCw,
  DollarSign,
  Baby,
  Search,
  Filter,
  MapPin,
  Navigation,
  CalendarDays,
  PhoneCall,
  UserCheck,
  Ban,
  Eye,
  Trash2,
} from "lucide-react";
import { IBooking } from "@/models/Booking";
import { apiGet, apiPatch } from "@/utils/api";

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const MapLine = ({ start, end }: { start: string; end: string }) => (
    <span className="flex items-center gap-1 truncate">
      <span className="max-w-[6rem] truncate" title={start}>
        {start}
      </span>
      <span className="text-gray-400 dark:text-gray-600">-&gt;</span>
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
  }, [bookings, activeTab, searchQuery, statusFilter, paymentFilter]);

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
            return bookingDate >= new Date() || b.status === "upcoming";
          });
          break;
        case "passed":
          filtered = bookings.filter((b) => {
            if (b.status === "canceled") return false;
            const bookingDate = new Date(b.date);
            return bookingDate < new Date() && b.status !== "upcoming";
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

      // Apply status filter
      if (statusFilter !== "all") {
        filtered = filtered.filter((booking) => {
          if (statusFilter === "upcoming") {
            const bookingDate = new Date(booking.date);
            return bookingDate >= new Date() && booking.status !== "canceled";
          }
          if (statusFilter === "completed") {
            const bookingDate = new Date(booking.date);
            return (
              bookingDate < new Date() &&
              booking.status !== "canceled" &&
              booking.status !== "upcoming"
            );
          }
          if (statusFilter === "canceled") {
            return booking.status === "canceled";
          }
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
  }, [bookings, activeTab, searchQuery, statusFilter, paymentFilter]);

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
      "text-white font-semibold flex items-center gap-1.5 px-3 py-1";
    switch (status) {
      case "completed":
        return (
          <Badge className={`${badgeClasses} bg-green-500 hover:bg-green-600`}>
            <CheckCircle className="w-3 h-3" /> {t("Dashboard.Rides.Paid")}
          </Badge>
        );
      case "pending":
        return (
          <Badge
            className={`${badgeClasses} bg-yellow-500 hover:bg-yellow-600`}
          >
            <Clock className="w-3 h-3" /> {t("Dashboard.Rides.Pending")}
          </Badge>
        );
      case "refunded":
        return (
          <Badge className={`${badgeClasses} bg-blue-500 hover:bg-blue-600`}>
            <RefreshCw className="w-3 h-3" /> {t("Dashboard.Rides.Refunded")}
          </Badge>
        );
      case "failed":
        return (
          <Badge className={`${badgeClasses} bg-red-500 hover:bg-red-600`}>
            <X className="w-3 h-3" /> {t("Dashboard.Rides.Failed")}
          </Badge>
        );
      default:
        return (
          <Badge className={`${badgeClasses} bg-gray-500`}>{status}</Badge>
        );
    }
  };

  const getStatusBadge = (booking: IBooking) => {
    const badgeClasses =
      "text-white font-semibold flex items-center gap-1.5 px-3 py-1";
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
    <Card className="group hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20 bg-card">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
          {/* Left Section - Trip Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Car className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground text-base sm:text-lg truncate">
                    {t("Dashboard.Rides.Trip")} #{booking.tripId.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {booking.vehicleDetails?.name || booking.selectedVehicle}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 ml-2">
                {getStatusBadge(booking)}
                {getPaymentStatusBadge(booking.paymentStatus)}
              </div>
            </div>

            {/* Trip Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground truncate">
                  {new Date(booking.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{booking.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm min-w-0 col-span-1 sm:col-span-2 lg:col-span-1">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <MapLine
                  start={booking.pickup}
                  end={booking.dropoff || "N/A"}
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">
                  {booking.passengers}{" "}
                  {booking.passengers > 1
                    ? t("Dashboard.Rides.Passengers")
                    : t("Dashboard.Rides.Passenger")}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {booking.firstName} {booking.lastName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate max-w-32">
                  {booking.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{booking.phone}</span>
              </div>
            </div>
          </div>

          {/* Right Section - Actions & Price */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 sm:gap-4 lg:gap-4 lg:min-w-48">
            <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-primary">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>€{booking.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto lg:w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailBooking(booking)}
                className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t("Dashboard.Rides.ViewDetails")}
                </span>
                <span className="sm:hidden">
                  {t("Dashboard.Rides.Details")}
                </span>
              </Button>

              {booking.status !== "canceled" && (
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
                      <span className="hidden sm:inline">
                        {t("Dashboard.Rides.Canceling")}
                      </span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {t("Dashboard.Rides.Cancel")}
                      </span>
                      <span className="sm:hidden">
                        {t("Dashboard.Rides.Cancel")}
                      </span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 xl:p-8">
        {/* Header Section */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 lg:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                {t("Dashboard.Rides.Title")}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                {t("Dashboard.Rides.Description")}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={fetchBookings}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="flex items-center gap-2 flex-1 sm:flex-none"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">
                  {t("Dashboard.Rides.Refresh")}
                </span>
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="p-3 sm:p-4">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={t("Dashboard.Rides.SearchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 sm:h-9"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-10 sm:h-9">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder={t("Dashboard.Rides.Status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("Dashboard.Rides.AllStatus")}
                    </SelectItem>
                    <SelectItem value="upcoming">
                      {t("Dashboard.Rides.Upcoming")}
                    </SelectItem>
                    <SelectItem value="completed">
                      {t("Dashboard.Rides.Completed")}
                    </SelectItem>
                    <SelectItem value="canceled">
                      {t("Dashboard.Rides.Canceled")}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-10 sm:h-9">
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
            </div>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-background border border-border p-1 rounded-lg shadow-sm h-auto">
            <TabsTrigger
              value="upcoming"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm text-xs sm:text-sm"
            >
              <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-medium text-center">
                <span className="hidden sm:inline">
                  {t("Dashboard.Rides.UpcomingRides").split(" ")[0]}{" "}
                </span>
                {t("Dashboard.Rides.UpcomingRides").split(" ")[1]}
              </span>
              {filteredBookings.length > 0 && activeTab === "upcoming" && (
                <Badge
                  variant="secondary"
                  className="ml-0 sm:ml-1 bg-primary/20 text-primary text-xs px-1.5 py-0.5"
                >
                  {filteredBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="passed"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm text-xs sm:text-sm"
            >
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-medium text-center">
                <span className="hidden sm:inline">
                  {t("Dashboard.Rides.CompletedRides").split(" ")[0]}{" "}
                </span>
                {t("Dashboard.Rides.CompletedRides").split(" ")[1]}
              </span>
              {filteredBookings.length > 0 && activeTab === "passed" && (
                <Badge
                  variant="secondary"
                  className="ml-0 sm:ml-1 bg-primary/20 text-primary text-xs px-1.5 py-0.5"
                >
                  {filteredBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="canceled"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md transition-all data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:shadow-sm text-xs sm:text-sm"
            >
              <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-medium text-center">
                <span className="hidden sm:inline">
                  {t("Dashboard.Rides.CanceledRides").split(" ")[0]}{" "}
                </span>
                {t("Dashboard.Rides.CanceledRides").split(" ")[1]}
              </span>
              <span className="sm:hidden font-medium">
                {t("Dashboard.Rides.CanceledRides").split(" ")[0]}
              </span>
              {filteredBookings.length > 0 && activeTab === "canceled" && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                >
                  {filteredBookings.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t("Dashboard.Rides.LoadingRides")}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t("Dashboard.Rides.LoadingRidesDescription")}
                </p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CalendarDays className="w-10 h-10 text-blue-400 dark:text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {t("Dashboard.Rides.NoUpcomingRides")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {t("Dashboard.Rides.NoUpcomingRidesDescription")}
                  </p>
                  <Button
                    onClick={fetchBookings}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t("Dashboard.Rides.refresh-list")}{" "}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
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
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t("Dashboard.Rides.loading-rides")}{" "}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t(
                    "Dashboard.Rides.please-wait-while-we-fetch-your-completed-rides"
                  )}{" "}
                </p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {t("Dashboard.Rides.NoCompletedRides")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {t("Dashboard.Rides.NoCompletedRidesDescription")}
                  </p>
                  <Button
                    onClick={fetchBookings}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t("Dashboard.Rides.refresh-list")}{" "}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
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
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 animate-spin text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t("Dashboard.Rides.loading-rides")}{" "}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t(
                    "Dashboard.Rides.please-wait-while-we-fetch-your-canceled-rides"
                  )}{" "}
                </p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Ban className="w-10 h-10 text-red-400 dark:text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {t("Dashboard.Rides.NoCanceledRides")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {t("Dashboard.Rides.NoCanceledRidesDescription")}
                  </p>
                  <Button
                    onClick={fetchBookings}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t("Dashboard.Rides.refresh-list")}{" "}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
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
                <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {t("Dashboard.Rides.trip")}#
                        {detailBooking.tripId.slice(0, 8)}
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 dark:text-gray-400 mt-1">
                        {t("Dashboard.Rides.scheduled-for")}r{" "}
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
                  <Card className="border border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <Navigation className="w-5 h-5 text-blue-600" />
                        {t("Dashboard.Rides.journey-details")}{" "}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">
                            {t("Dashboard.Rides.pickup-location")}{" "}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 ml-6">
                          {detailBooking.pickup}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">
                            {t("Dashboard.Rides.dropoff-location")}{" "}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 ml-6">
                          {detailBooking.dropoff ||
                            t("Dashboard.Rides.not-specified")}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-200">
                              {t("Dashboard.Rides.time")}{" "}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300">
                              {detailBooking.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-200">
                              {t("Dashboard.Rides.passengers")}{" "}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300">
                              {detailBooking.passengers}
                            </p>
                          </div>
                        </div>
                      </div>

                      {(detailBooking.childSeats > 0 ||
                        detailBooking.babySeats > 0) && (
                        <div className="flex items-center gap-2 text-sm text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg">
                          <Baby className="w-4 h-4" />
                          <span>
                            {detailBooking.childSeats > 0 &&
                              t(
                                "Dashboard.Rides.detailbooking-childseats-child-seat-detailbooking-childseats-greater-than-1-s",
                                {
                                  0: detailBooking.childSeats,
                                  1: detailBooking.childSeats > 1 ? "s" : "",
                                }
                              )}{" "}
                            {detailBooking.childSeats > 0 &&
                              detailBooking.babySeats > 0 &&
                              " • "}
                            {detailBooking.babySeats > 0 &&
                              t(
                                "Dashboard.Rides.detailbooking-babyseats-baby-seat-detailbooking-babyseats-greater-than-1-s",
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
                  <Card className="border border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <UserCheck className="w-5 h-5 text-green-600" />
                        {t('Dashboard.Rides.customer-information')} </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                          {detailBooking.firstName} {detailBooking.lastName}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <a
                            href={`mailto:${detailBooking.email}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {detailBooking.email}
                          </a>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <PhoneCall className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <a
                            href={`tel:${detailBooking.phone}`}
                            className="text-green-600 dark:text-green-400 hover:underline"
                          >
                            {detailBooking.phone}
                          </a>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="font-medium text-gray-700 dark:text-gray-200 mb-2">
                          {t('Dashboard.Rides.vehicle')} </p>
                        <p className="text-gray-600 dark:text-gray-300">
                          {detailBooking.vehicleDetails?.name ||
                            detailBooking.selectedVehicle}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Special Notes */}
                {detailBooking.notes && (
                  <Card className="border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                            {t('Dashboard.Rides.special-notes')} </p>
                          <p className="text-amber-700 dark:text-amber-300">
                            {detailBooking.notes}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Billing Information */}
                <Card className="border border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      {t('Dashboard.Rides.billing-and-payment')} </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {t('Dashboard.Rides.total-amount')} </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          €{detailBooking.totalAmount?.toFixed(2)}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {t('Dashboard.Rides.payment-method')} </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                          {detailBooking.paymentMethod?.replace("_", " ") ||
                            "N/A"}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {t('Dashboard.Rides.payment-status')} </p>
                        <div className="flex justify-center">
                          {getPaymentStatusBadge(detailBooking.paymentStatus)}
                        </div>
                      </div>

                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {t('Dashboard.Rides.trip-status')} </p>
                        <div className="flex justify-center">
                          {getStatusBadge(detailBooking)}
                        </div>
                      </div>
                    </div>

                    {/* Cancellation/Refund Info */}
                    {(detailBooking.status === "canceled" ||
                      detailBooking.refundAmount) && (
                      <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        {detailBooking.status === "canceled" &&
                          detailBooking.canceledAt && (
                            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-2">
                              <Ban className="w-4 h-4" />
                              <span className="font-medium">
                                {t('Dashboard.Rides.canceled-on')}n{" "}
                                {new Date(
                                  detailBooking.canceledAt
                                ).toLocaleString()}
                              </span>
                            </div>
                          )}
                        {detailBooking.refundAmount &&
                          detailBooking.refundAmount > 0 && (
                            <div className="flex items-center justify-between text-red-700 dark:text-red-300">
                              <span className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" />
                                {t('Dashboard.Rides.refund-processed')} </span>
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
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                {t('Dashboard.Rides.cancel-ride-and-process-refund')} </DialogTitle>
              <DialogDescription className="text-base pt-2">
                <span className="font-semibold">
                  {t('Dashboard.Rides.trip')}#{selectedBooking?.tripId.slice(0, 8)}
                </span>
                <span className="text-gray-500 mx-2">•</span>
                <span>
                  {selectedBooking?.firstName} {selectedBooking?.lastName}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold block mb-1">
                      {t('Dashboard.Rides.warning-this-action-cannot-be-undone')} </span>
                    {t('Dashboard.Rides.this-will-permanently-cancel-the-ride')}.{" "}
                    {selectedBooking &&
                      canRefund(selectedBooking) &&
                      t('Dashboard.Rides.a-refund-will-be-processed-automatically-to-the-customer')}
                  </span>
                </p>
              </div>

              {selectedBooking && canRefund(selectedBooking) && (
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                    {t('Dashboard.Rides.refund-percentage')} </label>
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
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        {t('Dashboard.Rides.refund-amount')} </span>
                      <span className="font-bold text-xl text-green-600 dark:text-green-500">
                        €
                        {(
                          (selectedBooking?.totalAmount || 0) *
                          (refundPercentage / 100)
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                      <span>{t('Dashboard.Rides.total-amount2')}</span>
                      <span>€{selectedBooking?.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedBooking?.paymentMethod === "cash" && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded-r-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                    <CreditCard className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>
                      <span className="font-semibold block mb-1">
                        {t('Dashboard.Rides.cash-payment')} </span>
                      {t('Dashboard.Rides.payment-method-is-cash-no-online-refund-will-be-processed-you-may-need-to-handle-the-refund-manually')} </span>
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
                {t('Dashboard.Rides.keep-ride')} </Button>
              <Button
                variant="destructive"
                onClick={handleCancelBooking}
                disabled={cancelingId !== null}
                className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
              >
                {cancelingId ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Processing...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" /> {t('Dashboard.Rides.confirm-cancellation')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
