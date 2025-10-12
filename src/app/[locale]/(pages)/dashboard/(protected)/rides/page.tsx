"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  User,
  Phone,
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
} from "lucide-react";
import { Booking } from '@/models/Booking';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function RidesPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [refundPercentage, setRefundPercentage] = useState(100);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

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
  }, [bookings, activeTab]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = () => {
    const now = new Date();
    let filtered: Booking[] = [];

    switch (activeTab) {
      case 'upcoming':
        filtered = bookings.filter(b => {
          if (b.status === 'canceled') return false;
          const bookingDate = new Date(b.date);
          return bookingDate >= now || b.status === 'upcoming';
        });
        break;
      case 'passed':
        filtered = bookings.filter(b => {
          if (b.status === 'canceled') return false;
          const bookingDate = new Date(b.date);
          return bookingDate < now && b.status !== 'upcoming';
        });
        break;
      case 'canceled':
        filtered = bookings.filter(b => b.status === 'canceled');
        break;
      default:
        filtered = bookings;
    }

    setFilteredBookings(filtered);
  };

  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setRefundPercentage(100);
    setShowCancelDialog(true);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking?._id) return;

    setCancelingId(selectedBooking._id.toString());
    try {
      const response = await fetch(`/api/bookings/${selectedBooking._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          refundPercentage: refundPercentage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setBookings(prev => prev.map(b => 
          b._id?.toString() === selectedBooking._id?.toString() ? data.data : b
        ));
        setShowCancelDialog(false);
        setSelectedBooking(null);
      } else {
        alert(`Failed to cancel booking: ${data.message}`);
      }
    } catch (error) {
      console.error('Error canceling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancelingId(null);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const badgeClasses = "text-white font-semibold flex items-center gap-1.5 px-3 py-1";
    switch (status) {
      case 'completed':
        return <Badge className={`${badgeClasses} bg-green-500 hover:bg-green-600`}><CheckCircle className="w-3 h-3" /> Paid</Badge>;
      case 'pending':
        return <Badge className={`${badgeClasses} bg-yellow-500 hover:bg-yellow-600`}><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'refunded':
        return <Badge className={`${badgeClasses} bg-blue-500 hover:bg-blue-600`}><RefreshCw className="w-3 h-3" /> Refunded</Badge>;
      case 'failed':
        return <Badge className={`${badgeClasses} bg-red-500 hover:bg-red-600`}><X className="w-3 h-3" /> Failed</Badge>;
      default:
        return <Badge className={`${badgeClasses} bg-gray-500`}>{status}</Badge>;
    }
  };

  const getStatusBadge = (booking: Booking) => {
    const badgeClasses = "text-white font-semibold flex items-center gap-1.5 px-3 py-1";
    if (booking.status === 'canceled') {
      return <Badge className={`${badgeClasses} bg-red-600 hover:bg-red-700`}><X className="w-3 h-3" /> Canceled</Badge>;
    }
    
    const bookingDate = new Date(booking.date);
    const now = new Date();
    
    if (bookingDate < now) {
      return <Badge className={`${badgeClasses} bg-gray-600 hover:bg-gray-700`}><CheckCircle className="w-3 h-3" /> Completed</Badge>;
    }
    
    return <Badge className={`${badgeClasses} bg-blue-600 hover:bg-blue-700`}><Calendar className="w-3 h-3" /> Upcoming</Badge>;
  };

  const canRefund = (booking: Booking) => {
    return booking.paymentStatus === 'completed' && 
           booking.paymentMethod && 
           ['stripe', 'bank_transfer'].includes(booking.paymentMethod) &&
           booking.status !== 'canceled';
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="mb-3 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-800 w-full">
      <CardContent className="p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Car className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                Trip #{booking.tripId.slice(0, 8)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {booking.vehicleDetails?.name || booking.selectedVehicle}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex sm:flex-row sm:items-center sm:gap-2">
            {getStatusBadge(booking)}
            {getPaymentStatusBadge(booking.paymentStatus)}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>
              {new Date(booking.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span>{booking.time}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <MapLine start={booking.pickup} end={booking.dropoff} />
          </div>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>€{booking.totalAmount?.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <div className="sm:hidden flex gap-2">
            {getStatusBadge(booking)}
            {getPaymentStatusBadge(booking.paymentStatus)}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto text-primary hover:text-primary"
            onClick={() => setDetailBooking(booking)}
          >
            View details
          </Button>
          {booking.status !== "canceled" && (
            <Button
              onClick={() => handleCancelClick(booking)}
              variant="destructive"
              size="sm"
              disabled={cancelingId === booking._id?.toString()}
              className="w-full sm:w-auto"
            >
              {cancelingId === booking._id?.toString() ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Canceling...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-full w-full flex-col gap-6 p-4 md:p-6">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Rides Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">View and manage all your bookings</p>
        </div>
        <Button 
          onClick={fetchBookings} 
          variant="outline" 
          size="sm"
          className="shadow-sm hover:shadow-md transition-all w-full sm:w-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
          <TabsTrigger 
            value="upcoming"
            className="flex items-center justify-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all py-2.5 sm:py-3 rounded-md"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Upcoming</span>
            <span className="sm:hidden">Up</span>
          </TabsTrigger>
          <TabsTrigger 
            value="passed"
            className="flex items-center justify-center gap-2 data-[state=active]:bg-gray-600 data-[state=active]:text-white transition-all py-2.5 sm:py-3 rounded-md"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Passed</span>
            <span className="sm:hidden">Past</span>
          </TabsTrigger>
          <TabsTrigger 
            value="canceled"
            className="flex items-center justify-center gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all py-2.5 sm:py-3 rounded-md"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Canceled</span>
            <span className="sm:hidden">Canc</span>
          </TabsTrigger>
        </TabsList>

  <TabsContent value="upcoming" className="mt-0 w-full">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
              <p className="text-sm text-gray-500">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-gray-700 dark:text-gray-300">No Upcoming Rides</h3>
                <p className="text-sm text-gray-500">You don&apos;t have any upcoming rides scheduled</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map(booking => (
                <BookingCard key={booking._id?.toString()} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>

  <TabsContent value="passed" className="mt-0 w-full">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
              <p className="text-sm text-gray-500">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-gray-700 dark:text-gray-300">No Passed Rides</h3>
                <p className="text-sm text-gray-500">You don&apos;t have any completed rides yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map(booking => (
                <BookingCard key={booking._id?.toString()} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>

  <TabsContent value="canceled" className="mt-0 w-full">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
              <p className="text-sm text-gray-500">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <X className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-gray-700 dark:text-gray-300">No Canceled Rides</h3>
                <p className="text-sm text-gray-500">You don&apos;t have any canceled rides</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map(booking => (
                <BookingCard key={booking._id?.toString()} booking={booking} />
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
        <DialogContent className="sm:max-w-[620px]">
          {detailBooking && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Car className="w-4 h-4 text-primary" />
                  </div>
                  <span>Trip #{detailBooking.tripId.slice(0, 8)}</span>
                </DialogTitle>
                <DialogDescription>
                  Scheduled for {new Date(detailBooking.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })} at {detailBooking.time}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Journey
                  </h4>
                  <div className="text-sm">
                    <p className="font-medium text-gray-700 dark:text-gray-200">Pickup</p>
                    <p className="text-gray-600 dark:text-gray-300">{detailBooking.pickup}</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-700 dark:text-gray-200">Dropoff</p>
                    <p className="text-gray-600 dark:text-gray-300">{detailBooking.dropoff}</p>
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span>{detailBooking.time}</span>
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span>
                      {detailBooking.passengers} passenger{detailBooking.passengers > 1 ? "s" : ""}
                    </span>
                  </div>
                  {(detailBooking.childSeats > 0 || detailBooking.babySeats > 0) && (
                    <div className="text-sm flex items-center gap-2 text-pink-600 dark:text-pink-300">
                      <Baby className="w-4 h-4" />
                      <span>
                        {detailBooking.childSeats > 0 && `${detailBooking.childSeats} child seat${detailBooking.childSeats > 1 ? "s" : ""}`}
                        {detailBooking.childSeats > 0 && detailBooking.babySeats > 0 && " • "}
                        {detailBooking.babySeats > 0 && `${detailBooking.babySeats} baby seat${detailBooking.babySeats > 1 ? "s" : ""}`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <User className="w-4 h-4" /> Customer
                  </h4>
                  <div className="text-sm">
                    <p className="font-medium text-gray-700 dark:text-gray-200">Name</p>
                    <p className="text-gray-600 dark:text-gray-300">
                      {detailBooking.firstName} {detailBooking.lastName}
                    </p>
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <a
                      href={`mailto:${detailBooking.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {detailBooking.email}
                    </a>
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-500" />
                    <a
                      href={`tel:${detailBooking.phone}`}
                      className="text-green-600 dark:text-green-400 hover:underline"
                    >
                      {detailBooking.phone}
                    </a>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-700 dark:text-gray-200">Vehicle</p>
                    <p className="text-gray-600 dark:text-gray-300">
                      {detailBooking.vehicleDetails?.name || detailBooking.selectedVehicle}
                    </p>
                  </div>
                </div>
              </div>

              {detailBooking.notes && (
                <div className="rounded-md border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-semibold flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4" /> Special notes
                  </p>
                  <p>{detailBooking.notes}</p>
                </div>
              )}

              <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <CreditCard className="w-4 h-4" /> Billing
                </h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      €{detailBooking.totalAmount?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="capitalize">
                      {detailBooking.paymentMethod?.replace("_", " ") || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                    <span>{detailBooking.paymentStatus}</span>
                  </div>
                </div>
                {detailBooking.status === "canceled" && detailBooking.canceledAt && (
                  <div className="rounded border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-2 text-xs text-red-700 dark:text-red-300">
                    Canceled on {new Date(detailBooking.canceledAt).toLocaleString()}
                  </div>
                )}
                {detailBooking.refundAmount && detailBooking.refundAmount > 0 && (
                  <div className="rounded border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-2 text-xs text-blue-700 dark:text-blue-300">
                    Refund: €{detailBooking.refundAmount.toFixed(2)} ({detailBooking.refundPercentage}%)
                  </div>
                )}
              </div>
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
              Cancel Ride & Process Refund
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              <span className="font-semibold">Trip #{selectedBooking?.tripId.slice(0, 8)}</span>
              <span className="text-gray-500 mx-2">•</span>
              <span>{selectedBooking?.firstName} {selectedBooking?.lastName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold block mb-1">Warning: This action cannot be undone</span>
                  This will permanently cancel the ride. {selectedBooking && canRefund(selectedBooking) && 'A refund will be processed automatically to the customer.'}
                </span>
              </p>
            </div>

            {selectedBooking && canRefund(selectedBooking) && (
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  Refund Percentage
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={refundPercentage}
                    onChange={(e) => setRefundPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-24 text-center font-bold text-lg"
                  />
                  <span className="text-lg font-semibold text-gray-600">%</span>
                  <div className="flex-1">
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={refundPercentage}
                      onChange={(e) => setRefundPercentage(parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                    />
                  </div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 dark:text-gray-300">Refund Amount:</span>
                    <span className="font-bold text-xl text-green-600 dark:text-green-500">
                      €{((selectedBooking?.totalAmount || 0) * (refundPercentage / 100)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                    <span>Total Amount:</span>
                    <span>€{selectedBooking?.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedBooking?.paymentMethod === 'cash' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded-r-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <CreditCard className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold block mb-1">Cash Payment</span>
                    Payment method is cash. No online refund will be processed. You may need to handle the refund manually.
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
              Keep Ride
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelBooking}
              disabled={cancelingId !== null}
              className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
            >
              {cancelingId ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><X className="w-4 h-4 mr-2" /> Confirm Cancellation</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
