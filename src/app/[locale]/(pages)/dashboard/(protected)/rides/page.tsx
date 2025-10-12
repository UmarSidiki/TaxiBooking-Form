"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Baby
} from 'lucide-react';
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
    <Card className="mb-3 hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary overflow-hidden w-full">
      <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <Car className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                <span className="font-semibold truncate">Trip #{booking.tripId.slice(0, 8)}</span>
                <span className="text-[11px] sm:text-xs text-gray-500 font-medium">
                  {booking.vehicleDetails?.name}
                </span>
              </div>
            </CardTitle>
          </div>
          <div className="flex flex-row sm:flex-col gap-1.5 items-start sm:items-end">
            {getStatusBadge(booking)}
            {getPaymentStatusBadge(booking.paymentStatus)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-3 space-y-3">
        {/* Journey Route */}
        <div className="p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-md border border-blue-100 dark:border-blue-800">
          <div className="flex items-start gap-2.5">
            <div className="flex flex-col items-center mt-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white shadow"></div>
              <div className="w-0.5 h-6 bg-gradient-to-b from-green-500 to-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white shadow"></div>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <div>
                <p className="text-[11px] font-medium text-green-700 dark:text-green-400 mb-0.5">Pickup</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{booking.pickup}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-red-700 dark:text-red-400 mb-0.5">Dropoff</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{booking.dropoff}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Trip Details */}
          <div className="space-y-2.5 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-md">
            <h4 className="font-semibold text-[11px] uppercase tracking-wide text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Trip Details
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {new Date(booking.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{booking.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {booking.passengers} passenger{booking.passengers > 1 ? 's' : ''}
                </span>
              </div>
              {(booking.childSeats > 0 || booking.babySeats > 0) && (
                <div className="flex items-start gap-2 text-xs pt-1.5 border-t border-gray-200 dark:border-gray-700">
                  <Baby className="w-3.5 h-3.5 text-pink-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {booking.childSeats > 0 && `${booking.childSeats} child seat${booking.childSeats > 1 ? 's' : ''}`}
                    {booking.childSeats > 0 && booking.babySeats > 0 && ' • '}
                    {booking.babySeats > 0 && `${booking.babySeats} baby seat${booking.babySeats > 1 ? 's' : ''}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-2.5 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-md">
            <h4 className="font-semibold text-[11px] uppercase tracking-wide text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <User className="w-4 h-4" /> Customer Info
            </h4>
            <div className="space-y-1.5">
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">Full Name</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {booking.firstName} {booking.lastName}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm group">
                <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <a 
                  href={`mailto:${booking.email}`} 
                  className="hover:underline text-blue-600 dark:text-blue-400 font-medium text-xs truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors"
                >
                  {booking.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm group">
                <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                <a 
                  href={`tel:${booking.phone}`} 
                  className="hover:underline text-green-600 dark:text-green-400 font-medium text-xs group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors"
                >
                  {booking.phone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {booking.notes && (
          <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
            <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Special Notes
            </p>
            <p className="text-xs text-amber-900 dark:text-amber-200">{booking.notes}</p>
          </div>
        )}

        {/* Payment & Actions */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Payment Method:</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 capitalize">
                  {booking.paymentMethod?.replace('_', ' ') || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-xl sm:text-2xl font-semibold text-green-600 dark:text-green-500">
                  €{booking.totalAmount?.toFixed(2)}
                </span>
              </div>
              {booking.refundAmount && booking.refundAmount > 0 && (
                <div className="flex items-center gap-2 p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-blue-700 dark:text-blue-300">
                    <span className="font-bold">€{booking.refundAmount.toFixed(2)}</span> refunded 
                    <span className="text-[10px] ml-1">({booking.refundPercentage}%)</span>
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {booking.status !== 'canceled' && (
                <Button
                  onClick={() => handleCancelClick(booking)}
                  variant="destructive"
                  size="sm"
                  disabled={cancelingId === booking._id?.toString()}
                  className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
                >
                  {cancelingId === booking._id?.toString() ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Canceling...</>
                  ) : (
                    <><X className="w-4 h-4 mr-2" /> Cancel Ride</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {booking.status === 'canceled' && booking.canceledAt && (
          <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-xs font-medium text-red-800 dark:text-red-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Canceled on {new Date(booking.canceledAt).toLocaleString()}</span>
            </p>
          </div>
        )}
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
