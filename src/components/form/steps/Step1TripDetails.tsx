"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { MapPin, CalendarDays, Clock, Users, Loader2, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useBookingForm } from '@/contexts/BookingFormContext';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import Image from 'next/image';

export default function Step1TripDetails() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    distanceData,
    setDistanceData,
    calculatingDistance,
    setCalculatingDistance,
    setCurrentStep,
    isLoading,
  } = useBookingForm();

  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);
  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const calculateDistance = useCallback(async (origin: string, destination: string) => {
    if (!origin || !destination) return;

    setCalculatingDistance(true);
    try {
      const response = await fetch('/api/distance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ origin, destination }),
      });

      const data = await response.json();
      if (data.success) {
        setDistanceData(data.data);
        
        // Update map route
        if (googleMapRef.current && window.google) {
          const directionsService = new google.maps.DirectionsService();
          
          directionsService.route(
            {
              origin: origin,
              destination: destination,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === 'OK' && result) {
                if (!directionsRendererRef.current) {
                  directionsRendererRef.current = new google.maps.DirectionsRenderer({
                    map: googleMapRef.current,
                    suppressMarkers: false,
                    polylineOptions: {
                      strokeColor: '#EAB308',
                      strokeWeight: 4,
                    },
                  });
                }
                directionsRendererRef.current.setDirections(result);
              }
            }
          );
        }
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
    } finally {
      setCalculatingDistance(false);
    }
  }, [setCalculatingDistance, setDistanceData]);

  useEffect(() => {
    const initGoogleMaps = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn("Google Maps API key not configured");
        return;
      }

      try {
        setOptions({
          key: apiKey,
          v: "weekly",
        });

        await Promise.all([
          importLibrary("core"),
          importLibrary("places"),
          importLibrary("maps"),
        ]);

        const google = window.google;

        if (!google?.maps?.places) {
          console.warn("Google Maps Places library failed to load");
          return;
        }

        // Initialize map
        if (mapRef.current && !googleMapRef.current) {
          googleMapRef.current = new google.maps.Map(mapRef.current, {
            center: { lat: 46.8182, lng: 8.2275 }, // Switzerland center
            zoom: 8,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
          setMapLoaded(true);
        }

        if (pickupInputRef.current) {
          const pickupAutocomplete = new google.maps.places.Autocomplete(
            pickupInputRef.current,
            { types: ["geocode"] }
          );
          pickupAutocomplete.addListener("place_changed", () => {
            const place = pickupAutocomplete.getPlace();
            if (place?.formatted_address) {
              const formattedAddress = place.formatted_address;
              const currentDropoff = formDataRef.current.dropoff;
              setFormData(prev => ({ ...prev, pickup: formattedAddress }));
              if (currentDropoff) {
                calculateDistance(formattedAddress, currentDropoff);
              }
            }
          });
        }

        if (dropoffInputRef.current) {
          const dropoffAutocomplete = new google.maps.places.Autocomplete(
            dropoffInputRef.current,
            { types: ["geocode"] }
          );
          dropoffAutocomplete.addListener("place_changed", () => {
            const place = dropoffAutocomplete.getPlace();
            if (place?.formatted_address) {
              const formattedAddress = place.formatted_address;
              const currentPickup = formDataRef.current.pickup;
              setFormData(prev => ({ ...prev, dropoff: formattedAddress }));
              if (currentPickup) {
                calculateDistance(currentPickup, formattedAddress);
              }
            }
          });
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    initGoogleMaps();
  }, [calculateDistance, setFormData]);

  const validateStep = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.pickup.trim()) {
      newErrors.pickup = "Pickup location is required";
    }
    if (!formData.dropoff.trim()) {
      newErrors.dropoff = "Dropoff location is required";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    if (!formData.time) {
      newErrors.time = "Time is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(2);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
      {/* Map Section - Left Side */}
      <div className="lg:col-span-3 max-sm:order-2">
        <Card className="h-full min-h-[500px] lg:min-h-[600px] overflow-hidden border-0 shadow-none">
          <div className="relative w-full h-full">
            <div ref={mapRef} className="w-full h-full" />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
              </div>
            )}
            
            {/* Distance Info Overlay */}
            {distanceData && (
              <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="font-semibold">{distanceData.distance.text}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-semibold">{distanceData.duration.text}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-semibold">{formData.date || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="text-xs text-gray-500">Passengers</p>
                      <p className="font-semibold">{formData.passengers}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Form Section - Right Side */}
      <div className="lg:col-span-4">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Plan Your Journey</h2>
            <p className="text-sm text-gray-600">Enter your trip details to get started</p>
          </div>

          {/* Pickup Location */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              <MapPin className="inline h-4 w-4 mr-1 text-green-600" />
              Pickup Location *
            </label>
            <Input 
              ref={pickupInputRef}
              placeholder="Enter pickup address or airport" 
              className={`${errors.pickup ? 'border-red-500' : 'border-gray-300'} focus:border-yellow-500 focus:ring-yellow-500`}
              value={formData.pickup}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, pickup: e.target.value }));
                if (errors.pickup) setErrors(prev => ({ ...prev, pickup: undefined }));
              }}
              onBlur={() => {
                if (formData.pickup && formData.dropoff) {
                  calculateDistance(formData.pickup, formData.dropoff);
                }
              }}
            />
            {errors.pickup && <p className="text-red-500 text-xs mt-1">{errors.pickup}</p>}
          </div>

          {/* Dropoff Location */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              <MapPin className="inline h-4 w-4 mr-1 text-red-600" />
              Dropoff Location *
            </label>
            <Input 
              ref={dropoffInputRef}
              placeholder="Enter destination address" 
              className={`${errors.dropoff ? 'border-red-500' : 'border-gray-300'} focus:border-yellow-500 focus:ring-yellow-500`}
              value={formData.dropoff}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, dropoff: e.target.value }));
                if (errors.dropoff) setErrors(prev => ({ ...prev, dropoff: undefined }));
              }}
              onBlur={() => {
                if (formData.pickup && formData.dropoff) {
                  calculateDistance(formData.pickup, formData.dropoff);
                }
              }}
            />
            {errors.dropoff && <p className="text-red-500 text-xs mt-1">{errors.dropoff}</p>}
            {calculatingDistance && (
              <p className="text-xs text-gray-500 mt-1 flex items-center">
                <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                Calculating route...
              </p>
            )}
          </div>

          {/* Trip Type */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">Trip Type</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, tripType: "oneway" }))}
                variant="outline"
                className={`${
                  formData.tripType === "oneway"
                    ? "bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                One Way
              </Button>
              <Button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, tripType: "return" }))}
                variant="outline"
                className={`${
                  formData.tripType === "return"
                    ? "bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                Round Trip
              </Button>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                <CalendarDays className="inline h-4 w-4 mr-1" />
                Date *
              </label>
              <Input 
                type="date"
                className={`${errors.date ? 'border-red-500' : 'border-gray-300'} focus:border-yellow-500 focus:ring-yellow-500`}
                value={formData.date}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, date: e.target.value }));
                  if (errors.date) setErrors(prev => ({ ...prev, date: undefined }));
                }}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                <Clock className="inline h-4 w-4 mr-1" />
                Time *
              </label>
              <Input 
                type="time"
                className={`${errors.time ? 'border-red-500' : 'border-gray-300'} focus:border-yellow-500 focus:ring-yellow-500`}
                value={formData.time}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, time: e.target.value }));
                  if (errors.time) setErrors(prev => ({ ...prev, time: undefined }));
                }}
              />
              {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
            </div>
          </div>

          {/* Passengers */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              <Users className="inline h-4 w-4 mr-1" />
              Number of Passengers
            </label>
            <Input 
              type="number"
              min="1"
              max="8"
              className="border-gray-300 focus:border-yellow-500 focus:ring-yellow-500" 
              value={formData.passengers}
              onChange={(e) => setFormData(prev => ({ ...prev, passengers: parseInt(e.target.value) || 1 }))}
            />
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-blue-700">
              <strong>Free cancellation</strong> up to 24 hours before pickup. Instant booking confirmation.
            </p>
          </div>

          {/* Next Button */}
          <Button 
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-6 text-base rounded-lg"
            onClick={handleNext}
            disabled={isLoading || calculatingDistance}
          >
            {isLoading || calculatingDistance ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Continue to Vehicle Selection
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          {/* Payment Icons */}
          <div className="flex justify-center gap-2 flex-wrap pt-2">
            <Image src="/visa.webp" alt="Visa" width={35} height={25} className="h-6 w-auto opacity-70" />
            <Image src="/mastercard.webp" alt="MasterCard" width={35} height={25} className="h-6 w-auto opacity-70" />
            <Image src="/paypal.webp" alt="PayPal" width={35} height={25} className="h-6 w-auto opacity-70" />
            <Image src="/twint.webp" alt="Twint" width={35} height={25} className="h-6 w-auto opacity-70" />
            <Image src="/applepay.webp" alt="Apple Pay" width={35} height={25} className="h-6 w-auto opacity-70" />
          </div>

          {/* Support Info */}
          <div className="text-center text-xs text-gray-500 space-y-1 pt-2">
            <p>24/7 Support Available • Secure Payment • Licensed Drivers</p>
            <p className="flex items-center justify-center gap-2 flex-wrap">
              <span>📞 +41 76 386 8121</span>
              <span>•</span>
              <span>✉️ booking@swissride-sarl.ch</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
