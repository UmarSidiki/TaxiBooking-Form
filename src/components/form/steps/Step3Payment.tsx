"use client";

import React from 'react';
import { ArrowLeft, Check, Loader2, MapPin, Clock, Calendar, Users, CheckCircle2, Shield, CreditCard, Phone, Mail, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useBookingForm } from '@/contexts/BookingFormContext';
import Image from 'next/image';

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

  const validateStep = (): boolean => {
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
    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = "Card number is required";
    } else if (formData.cardNumber.replace(/\s/g, "").length < 13) {
      newErrors.cardNumber = "Card number is invalid";
    }
    if (!formData.expiry.trim()) {
      newErrors.expiry = "Expiry date is required";
    }
    if (!formData.cvv.trim()) {
      newErrors.cvv = "CVV is required";
    } else if (formData.cvv.length < 3) {
      newErrors.cvv = "CVV must be at least 3 digits";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Booking confirmed! Trip ID: ${data.tripId}\nTotal Amount: €${data.totalAmount}\n\nConfirmation emails have been sent to both you and the owner.`);
        resetForm();
      } else {
        alert(`Booking failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v._id === formData.selectedVehicle);
  const vehiclePrice = selectedVehicle ? (
    distanceData ? 
    Math.max(selectedVehicle.price + (selectedVehicle.pricePerKm * distanceData.distance.km), selectedVehicle.minimumFare) :
    selectedVehicle.price
  ) : 0;
  
  const childSeatPrice = selectedVehicle?.childSeatPrice || 10;
  const babySeatPrice = selectedVehicle?.babySeatPrice || 10;
  const extrasPrice = (formData.childSeats * childSeatPrice) + (formData.babySeats * babySeatPrice);
  const totalPrice = vehiclePrice + extrasPrice;

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
          <h3 className="font-semibold mb-4 text-lg">Payment Details</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Card Number *</label>
              <Input
                placeholder="1234 5678 9012 3456"
                className={errors.cardNumber ? 'border-red-500' : ''}
                maxLength={19}
                value={formData.cardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
                  setFormData(prev => ({ ...prev, cardNumber: value }));
                  if (errors.cardNumber) setErrors(prev => ({ ...prev, cardNumber: undefined }));
                }}
              />
              {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Expiry Date *</label>
                <Input
                  placeholder="MM/YY"
                  className={errors.expiry ? 'border-red-500' : ''}
                  maxLength={5}
                  value={formData.expiry}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + '/' + value.slice(2, 4);
                    }
                    setFormData(prev => ({ ...prev, expiry: value }));
                    if (errors.expiry) setErrors(prev => ({ ...prev, expiry: undefined }));
                  }}
                />
                {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">CVV *</label>
                <Input
                  placeholder="123"
                  className={errors.cvv ? 'border-red-500' : ''}
                  maxLength={4}
                  value={formData.cvv}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData(prev => ({ ...prev, cvv: value }));
                    if (errors.cvv) setErrors(prev => ({ ...prev, cvv: undefined }));
                  }}
                />
                {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
              </div>
            </div>

            <div className="flex justify-center gap-2 pt-3 border-t">
              <Image src="/visa.webp" alt="Visa" width={40} height={28} className="h-7 w-auto" />
              <Image src="/mastercard.webp" alt="MasterCard" width={40} height={28} className="h-7 w-auto" />
              <Image src="/paypal.webp" alt="PayPal" width={40} height={28} className="h-7 w-auto" />
              <Image src="/twint.webp" alt="Twint" width={40} height={28} className="h-7 w-auto" />
              <Image src="/applepay.webp" alt="Apple Pay" width={40} height={28} className="h-7 w-auto" />
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => setCurrentStep(2)}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Vehicles
          </Button>
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg"
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" /> Pay €{totalPrice.toFixed(2)}
              </>
            )}
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
                  <span className="text-gray-700">{distanceData.distance.text} - {formData.tripType === 'oneway' ? 'One Way' : 'Return'}</span>
                </div>
              </>
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
