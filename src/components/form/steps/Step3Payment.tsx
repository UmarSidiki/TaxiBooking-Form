"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, MapPin, Clock, Calendar, Users, CheckCircle2, Shield, CreditCard, Phone, Mail, Car, Wallet, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useBookingForm } from '@/contexts/BookingFormContext';
import dynamic from 'next/dynamic';

import { ISetting } from '@/models/Setting';

const StripeProvider = dynamic(() => import('@/components/providers/stripe-provider'), { ssr: false });
const StripePaymentForm = dynamic(() => import('@/components/payment/StripePaymentForm'), { ssr: false });

export default function Step3Payment() {
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    vehicles,
    distanceData,
    setCurrentStep,
    isLoading,
    setIsLoading,
    resetForm,
  } = useBookingForm();

  const [stripeConfig, setStripeConfig] = useState<{ enabled: boolean; publishableKey: string | null }>({ 
    enabled: false, 
    publishableKey: null 
  });
  const [paymentSettings, setPaymentSettings] = useState<ISetting | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false);

  // Fetch payment configuration
  useEffect(() => {
    const fetchPaymentConfig = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success) {
          setPaymentSettings(data.data);
          if (data.data.stripePublishableKey) {
            setStripeConfig({
              enabled: true,
              publishableKey: data.data.stripePublishableKey,
            });
          }
          // Set default payment method
          if (data.data.acceptedPaymentMethods?.length > 0) {
            setSelectedPaymentMethod(data.data.acceptedPaymentMethods[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching payment config:', error);
      }
    };
    fetchPaymentConfig();
  }, []);

  const selectedVehicle = vehicles.find(v => v._id === formData.selectedVehicle);
  
  const calculateVehiclePrice = () => {
    if (!selectedVehicle) return 0;

    // Hourly booking calculation
    if (formData.bookingType === 'hourly') {
      const pricePerHour = selectedVehicle.pricePerHour || 30;
      const minimumHours = selectedVehicle.minimumHours || 2;
      const hours = Math.max(formData.duration, minimumHours);
      return pricePerHour * hours;
    } 
    // Destination-based booking calculation
    else {
      if (!distanceData) {
        return selectedVehicle.price;
      }
      const distancePrice = selectedVehicle.pricePerKm * distanceData.distance.km;
      let oneWayPrice = selectedVehicle.price + distancePrice;
      oneWayPrice = Math.max(oneWayPrice, selectedVehicle.minimumFare);

      let totalPrice = oneWayPrice;
      if (formData.tripType === 'roundtrip') {
        const returnPercentage = selectedVehicle.returnPricePercentage === undefined ? 100 : selectedVehicle.returnPricePercentage;
        totalPrice = oneWayPrice + (oneWayPrice * (returnPercentage / 100));
      }
      return totalPrice;
    }
  };

  const vehiclePrice = calculateVehiclePrice();
  
  // Apply discount
  const discount = selectedVehicle?.discount || 0;
  const discountedVehiclePrice = discount > 0 ? vehiclePrice * (1 - discount / 100) : vehiclePrice;
  
  const childSeatPrice = selectedVehicle?.childSeatPrice || 10;
  const babySeatPrice = selectedVehicle?.babySeatPrice || 10;
  const extrasPrice = (formData.childSeats * childSeatPrice) + (formData.babySeats * babySeatPrice);
  const totalPrice = discountedVehiclePrice + extrasPrice;

  const validatePersonalDetails = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createPaymentIntent = async () => {
    if (!validatePersonalDetails()) {
      alert('Please fill in all personal details first');
      return;
    }

    setCreatingPaymentIntent(true);
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: totalPrice, 
          currency: paymentSettings?.stripeCurrency || 'eur',
          customerEmail: formData.email,
          customerName: `${formData.firstName} ${formData.lastName}`,
          description: `Booking from ${formData.pickup} to ${formData.dropoff}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setClientSecret(data.clientSecret);
      } else {
        alert('Failed to initialize payment');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      alert('Failed to initialize payment');
    } finally {
      setCreatingPaymentIntent(false);
    }
  };

  const handleStripePaymentSuccess = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, paymentMethod: 'stripe', totalAmount: totalPrice }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Booking confirmed! Trip ID: ${data.tripId}\nTotal Amount: €${totalPrice.toFixed(2)}\n\nConfirmation emails have been sent.`);
        resetForm();
      } else {
        alert(`Booking failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("Booking failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`);
  };

  const handleCashBooking = async () => {
    // Validate required fields
    const newErrors: typeof errors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          paymentMethod: 'cash', 
          paymentStatus: 'pending',
          totalAmount: totalPrice 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Booking confirmed! Trip ID: ${data.tripId}\n\nTotal Amount: €${totalPrice.toFixed(2)}\nPayment Method: Cash on Arrival\n\nPlease have the exact amount ready. Confirmation email has been sent.`);
        resetForm();
      } else {
        alert(`Booking failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("Booking failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBankTransferBooking = async () => {
    // Validate required fields
    const newErrors: typeof errors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          paymentMethod: 'bank_transfer', 
          paymentStatus: 'pending',
          totalAmount: totalPrice 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Booking confirmed! Trip ID: ${data.tripId}\n\nTotal Amount: €${totalPrice.toFixed(2)}\nPayment Method: Bank Transfer\n\nYour booking will be confirmed once payment is received. Bank transfer details have been sent to your email.`);
        resetForm();
      } else {
        alert(`Booking failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("Booking failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Payment Form */}
      <div className="lg:col-span-2 space-y-4">
        {/* Optional Extras */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 text-lg">Optional Extras</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Child seats</label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">€{childSeatPrice} each</span>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  className="w-20"
                  value={formData.childSeats}
                  onChange={(e) => setFormData(prev => ({ ...prev, childSeats: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Baby seats</label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">€{babySeatPrice} each</span>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  className="w-20"
                  value={formData.babySeats}
                  onChange={(e) => setFormData(prev => ({ ...prev, babySeats: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Special requests (optional)</label>
              <Input
                placeholder="Any special requirements or notes..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
        </Card>

        {/* Personal Details */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 text-lg">Personal Details</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">First Name *</label>
                <Input
                  placeholder="John"
                  className={errors.firstName ? 'border-red-500' : ''}
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, firstName: e.target.value }));
                    if (errors.firstName) setErrors(prev => ({ ...prev, firstName: undefined }));
                  }}
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Last Name *</label>
                <Input
                  placeholder="Doe"
                  className={errors.lastName ? 'border-red-500' : ''}
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, lastName: e.target.value }));
                    if (errors.lastName) setErrors(prev => ({ ...prev, lastName: undefined }));
                  }}
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Email Address *</label>
              <Input
                type="email"
                placeholder="john.doe@example.com"
                className={errors.email ? 'border-red-500' : ''}
                value={formData.email}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Phone Number *</label>
              <Input
                placeholder="+41 76 123 4567"
                className={errors.phone ? 'border-red-500' : ''}
                value={formData.phone}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, phone: e.target.value }));
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                }}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>
        </Card>

        {/* Payment Details */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </h3>
          
          {/* Payment Method Selection */}
          {paymentSettings?.acceptedPaymentMethods && paymentSettings.acceptedPaymentMethods.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {paymentSettings.acceptedPaymentMethods.includes('card') && stripeConfig.enabled && (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('card')}
                    className={`p-4 border-2 rounded-xl text-left transition-all relative overflow-hidden ${
                      selectedPaymentMethod === 'card'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          selectedPaymentMethod === 'card' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <CreditCard className={`h-5 w-5 ${
                            selectedPaymentMethod === 'card' ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Credit/Debit Card</p>
                          <p className="text-xs text-gray-500">Visa, Mastercard, Amex & more</p>
                        </div>
                      </div>
                      {selectedPaymentMethod === 'card' && (
                        <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </button>
                )}
                
                {paymentSettings.acceptedPaymentMethods.includes('cash') && (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('cash')}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      selectedPaymentMethod === 'cash'
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          selectedPaymentMethod === 'cash' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Wallet className={`h-5 w-5 ${
                            selectedPaymentMethod === 'cash' ? 'text-green-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Cash Payment</p>
                          <p className="text-xs text-gray-500">Pay in cash to the driver</p>
                        </div>
                      </div>
                      {selectedPaymentMethod === 'cash' && (
                        <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </button>
                )}
                
                {paymentSettings.acceptedPaymentMethods.includes('bank_transfer') && (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('bank_transfer')}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      selectedPaymentMethod === 'bank_transfer'
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          selectedPaymentMethod === 'bank_transfer' ? 'bg-indigo-100' : 'bg-gray-100'
                        }`}>
                          <Building2 className={`h-5 w-5 ${
                            selectedPaymentMethod === 'bank_transfer' ? 'text-indigo-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Bank Transfer</p>
                          <p className="text-xs text-gray-500">Transfer to our bank account</p>
                        </div>
                      </div>
                      {selectedPaymentMethod === 'bank_transfer' && (
                        <div className="flex items-center gap-1 text-indigo-600 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </button>
                )}
              </div>

              {/* Stripe Card Payment */}
              {selectedPaymentMethod === 'card' && stripeConfig.publishableKey && (
                <div className="mt-4">
                  {!clientSecret ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-4">
                        Click below to proceed with secure card payment
                      </p>
                      <Button
                        onClick={createPaymentIntent}
                        disabled={creatingPaymentIntent}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
                      >
                        {creatingPaymentIntent ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Initializing Payment...
                          </>
                        ) : (
                          <>
                            Proceed to Card Payment - €{totalPrice.toFixed(2)}
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <StripeProvider
                      publishableKey={stripeConfig.publishableKey}
                      clientSecret={clientSecret}
                    >
                      <StripePaymentForm
                        amount={totalPrice}
                        currency={(paymentSettings?.stripeCurrency || 'eur').toUpperCase()}
                        onSuccess={handleStripePaymentSuccess}
                        onError={handleStripePaymentError}
                      />
                    </StripeProvider>
                  )}
                </div>
              )}

              {/* Cash Payment Info */}
              {selectedPaymentMethod === 'cash' && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 mb-1">Cash Payment Selected</p>
                      <p className="text-sm text-green-800">
                        You will pay €{totalPrice.toFixed(2)} in cash directly to the driver at pickup.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleCashBooking}
                    disabled={isLoading}
                    className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Confirming Booking...
                      </>
                    ) : (
                      <>
                        Confirm Booking - Pay Cash on Arrival
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Bank Transfer Info */}
              {selectedPaymentMethod === 'bank_transfer' && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 mb-1">Bank Transfer Instructions</p>
                      <p className="text-sm text-blue-800">
                        Please transfer €{totalPrice.toFixed(2)} to the account below. Your booking will be confirmed once payment is received.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 space-y-3 text-sm">
                    {paymentSettings.bankName && (
                      <div>
                        <p className="text-gray-500 text-xs">Bank Name</p>
                        <p className="font-medium">{paymentSettings.bankName}</p>
                      </div>
                    )}
                    {paymentSettings.bankAccountName && (
                      <div>
                        <p className="text-gray-500 text-xs">Account Name</p>
                        <p className="font-medium">{paymentSettings.bankAccountName}</p>
                      </div>
                    )}
                    {paymentSettings.bankAccountNumber && (
                      <div>
                        <p className="text-gray-500 text-xs">Account Number</p>
                        <p className="font-medium">{paymentSettings.bankAccountNumber}</p>
                      </div>
                    )}
                    {paymentSettings.bankIBAN && (
                      <div>
                        <p className="text-gray-500 text-xs">IBAN</p>
                        <p className="font-medium font-mono">{paymentSettings.bankIBAN}</p>
                      </div>
                    )}
                    {paymentSettings.bankSwiftBIC && (
                      <div>
                        <p className="text-gray-500 text-xs">SWIFT/BIC</p>
                        <p className="font-medium">{paymentSettings.bankSwiftBIC}</p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleBankTransferBooking}
                    disabled={isLoading}
                    className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Confirming Booking...
                      </>
                    ) : (
                      <>
                        Confirm Booking - I Will Transfer Payment
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-2">No payment methods configured</p>
              <p className="text-sm text-gray-500">
                Please contact the administrator to set up payment processing
              </p>
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => setCurrentStep(2)}
            variant="outline"
            className="flex-1"
            disabled={isLoading || creatingPaymentIntent}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Vehicles
          </Button>
        </div>
      </div>

      {/* Sidebar - Booking Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4 p-5 space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">Booking Summary</h3>

          {/* Trip Details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Pickup</p>
                <p className="font-medium text-gray-900">{formData.pickup}</p>
              </div>
            </div>

            {formData.bookingType === 'destination' ? (
              <>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Dropoff</p>
                    <p className="font-medium text-gray-900">{formData.dropoff}</p>
                  </div>
                </div>

                {distanceData && (
                  <>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700">{distanceData.duration.text}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span className="text-gray-700">{distanceData.distance.text} - {formData.tripType === 'oneway' ? 'One Way' : 'Round Trip'}</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700">{formData.duration} {formData.duration === 1 ? 'hour' : 'hours'} - Hourly Booking</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">{formData.date} at {formData.time}</span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">{formData.passengers} Passenger(s)</span>
            </div>
          </div>

          {/* Selected Vehicle */}
          {selectedVehicle && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Selected Vehicle</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedVehicle.name}</p>
                <p className="text-xs text-gray-600 mt-1">{selectedVehicle.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-600">Base fare</span>
                  <span className="font-semibold">€{vehiclePrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Extras */}
          {(formData.childSeats > 0 || formData.babySeats > 0) && (
            <div className="border-t pt-3">
              <p className="font-semibold text-sm mb-2">Extras</p>
              <div className="space-y-1 text-sm">
                {formData.childSeats > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Child seats × {formData.childSeats}</span>
                    <span className="font-medium">€{(formData.childSeats * childSeatPrice).toFixed(2)}</span>
                  </div>
                )}
                {formData.babySeats > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Baby seats × {formData.babySeats}</span>
                    <span className="font-medium">€{(formData.babySeats * babySeatPrice).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>TOTAL</span>
              <span className="text-2xl text-primary">€{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="border-t pt-3 space-y-2">
            <h4 className="font-semibold text-sm mb-2">What&apos;s Included</h4>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Door to Door Service</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Meet & Greet</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Instant Confirmation</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Free Cancellation (24h)</span>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="border-t pt-3 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span>24/7 Customer Support</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4 text-gray-500" />
              <a href="mailto:booking@swissride-sarl.ch" className="hover:text-primary">
                booking@swissride-sarl.ch
              </a>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-500" />
              <a href="tel:+41763868121" className="hover:text-primary">
                +41 76 3868121
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
