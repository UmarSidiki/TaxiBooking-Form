"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { MapPin, CalendarDays, Clock, Users, Loader2, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useBookingForm } from '@/contexts/BookingFormContext';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from 'next-intl';

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

  const t = useTranslations();

  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);
  const formDataRef = useRef(formData);
  const { settings } = useTheme();

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const calculateDistance = useCallback(async (origin: string, destination: string, isRoundTrip: boolean = false) => {
    if (!origin || !destination) return;

    setCalculatingDistance(true);
    try {
      const response = await fetch('/api/distance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ origin, destination, isRoundTrip }),
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
                      strokeColor: 'var(--primary-color)',
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

        const [maps, places] = await Promise.all([
          importLibrary("maps"),
          importLibrary("places"),
        ]);

        // Initialize map
        if (mapRef.current && !googleMapRef.current) {
          const initialCenter =
            settings && settings.mapInitialLat && settings.mapInitialLng
              ? { lat: settings.mapInitialLat, lng: settings.mapInitialLng }
              : { lat: 46.2044, lng: 6.1432 }; // Default to Geneva

          googleMapRef.current = new maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: 8,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
          setMapLoaded(true);
        }

        const autocompleteOptions = {
          componentRestrictions: settings?.mapCountryRestrictions?.length 
            ? { country: settings.mapCountryRestrictions }
            : undefined,
        };

        // Setup Autocomplete
        if (pickupInputRef.current) {
          const autocompletePickup = new places.Autocomplete(
            pickupInputRef.current,
            autocompleteOptions
          );
          autocompletePickup.addListener('place_changed', () => {
            const place = autocompletePickup.getPlace();
            const newPickup = place.formatted_address || place.name || '';
            setFormData(prev => ({ ...prev, pickup: newPickup }));
            if (formDataRef.current.dropoff) {
              calculateDistance(newPickup, formDataRef.current.dropoff, formDataRef.current.tripType === 'roundtrip');
            }
          });
        }

        if (dropoffInputRef.current) {
          const autocompleteDropoff = new places.Autocomplete(
            dropoffInputRef.current,
            autocompleteOptions
          );
          autocompleteDropoff.addListener('place_changed', () => {
            const place = autocompleteDropoff.getPlace();
            const newDropoff = place.formatted_address || place.name || '';
            setFormData(prev => ({ ...prev, dropoff: newDropoff }));
            if (formDataRef.current.pickup) {
              calculateDistance(formDataRef.current.pickup, newDropoff, formDataRef.current.tripType === 'roundtrip');
            }
          });
        }

        // If we have pickup and dropoff from context, show the route
        if (formData.pickup && formData.dropoff) {
          calculateDistance(formData.pickup, formData.dropoff, formData.tripType === 'roundtrip');
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    if (settings) {
      initGoogleMaps();
    }
  }, [settings, calculateDistance, formData.pickup, formData.dropoff, formData.tripType, setFormData]);

  const validateStep = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.pickup.trim()) {
      newErrors.pickup = t('Step1.pickup-location-is-required');
    }
    
    // Dropoff is only required for destination-based bookings
    if (formData.bookingType === 'destination' && !formData.dropoff.trim()) {
      newErrors.dropoff = t('Step1.dropoff-location-is-required');
    }
    
    if (!formData.date) {
      newErrors.date = t('Step1.date-is-required');
    }
    if (!formData.time) {
      newErrors.time = t('Step1.time-is-required');
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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {/* Distance Info Overlay */}
            {distanceData && (
              <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">{t("Step1.Distance")}</p>
                      <p className="font-semibold">{distanceData.distance.text}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">{t("Step1.Duration")}</p>
                      <p className="font-semibold">{distanceData.duration.text}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">{t("Step1.Date")}</p>
                      <p className="font-semibold">{formData.date || t('not-set')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">{t("Step1.Passengers")}</p>
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
            <h2 className="text-xl font-semibold mb-2">{t("Step1.Title")}</h2>
            <p className="text-sm text-gray-600">{t("Step1.Description")}</p>
          </div>

          {/* Booking Type */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">{t("Step1.BookingType")}</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, bookingType: "destination" }));
                  setErrors(prev => ({ ...prev, dropoff: undefined }));
                }}
                variant="outline"
                className={`${
                  formData.bookingType === "destination"
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <MapPin className="mr-2 h-4 w-4" />
                {t("Step1.DestinationBased")}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, bookingType: "hourly", dropoff: "" }));
                  setErrors(prev => ({ ...prev, dropoff: undefined }));
                }}
                variant="outline"
                className={`${
                  formData.bookingType === "hourly"
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <Clock className="mr-2 h-4 w-4" />
                {t("Step1.TimeBased")}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.bookingType === "destination" 
                ? t('Step1.price-based-on-distance-traveled') 
                : t('Step1.price-based-on-hourly-rate')}
            </p>
          </div>

          {/* Pickup Location */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              <MapPin className="inline h-4 w-4 mr-1 text-green-600" />
              {t("Step1.PickupLocation")} *
            </label>
            <Input 
              ref={pickupInputRef}
              placeholder={t("Step1.PickupPlaceholder")} 
              className={`${errors.pickup ? 'border-red-500' : 'border-gray-300'} focus:border-primary-500 focus:ring-primary-500`}
              value={formData.pickup}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, pickup: e.target.value }));
                if (errors.pickup) setErrors(prev => ({ ...prev, pickup: undefined }));
              }}
              onBlur={() => {
                if (formData.pickup && formData.dropoff) {
                  calculateDistance(formData.pickup, formData.dropoff, formData.tripType === 'roundtrip');
                }
              }}
            />
            {errors.pickup && <p className="text-red-500 text-xs mt-1">{errors.pickup}</p>}
          </div>

          {/* Dropoff Location - Only for destination-based bookings */}
          {formData.bookingType === 'destination' && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                <MapPin className="inline h-4 w-4 mr-1 text-red-600" />
                {t("Step1.DropoffLocation")} *
              </label>
              <Input 
                ref={dropoffInputRef}
                placeholder={t("Step1.DropoffPlaceholder")} 
                className={`${errors.dropoff ? 'border-red-500' : 'border-gray-300'} focus:border-primary-500 focus:ring-primary-500`}
                value={formData.dropoff}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, dropoff: e.target.value }));
                  if (errors.dropoff) setErrors(prev => ({ ...prev, dropoff: undefined }));
                }}
                onBlur={() => {
                  if (formData.pickup && formData.dropoff) {
                    calculateDistance(formData.pickup, formData.dropoff, formData.tripType === 'roundtrip');
                  }
                }}
              />
              {errors.dropoff && <p className="text-red-500 text-xs mt-1">{errors.dropoff}</p>}
              {calculatingDistance && (
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                  {t("Step1.CalculatingDistance")}
                </p>
              )}
            </div>
          )}

          {/* Duration - Only for hourly bookings */}
          {formData.bookingType === 'hourly' && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                <Clock className="inline h-4 w-4 mr-1" />
                {t("Step1.Duration")} *
              </label>
              <Input 
                type="number"
                min="1"
                step="1"
                placeholder="2"
                className="focus:border-primary-500 focus:ring-primary-500"
                value={formData.duration}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }));
                }}
              />
              <p className="text-xs text-gray-500 mt-1">{t("Step1.DurationDescription")}</p>
            </div>
          )}

          {/* Trip Type - Only for destination-based bookings */}
          {formData.bookingType === 'destination' && (
            <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">Trip Type</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, tripType: "oneway" }));
                  if (formData.pickup && formData.dropoff) {
                    calculateDistance(formData.pickup, formData.dropoff, false);
                  }
                }}
                variant="outline"
                className={`${
                  formData.tripType === "oneway"
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {t("Step1.OneWay")}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, tripType: "roundtrip" }));
                  if (formData.pickup && formData.dropoff) {
                    calculateDistance(formData.pickup, formData.dropoff, true);
                  }
                }}
                variant="outline"
                className={`${
                  formData.tripType === "roundtrip"
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {t("Step1.RoundTrip")}
              </Button>
            </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                <CalendarDays className="inline h-4 w-4 mr-1" />
                {t("Step1.Date")} *
              </label>
              <Input 
                type="date"
                className={`${errors.date ? 'border-red-500' : 'border-gray-300'} focus:border-primary-500 focus:ring-primary-500`}
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
                {t("Step1.Time")} *
              </label>
              <Input 
                type="time"
                className={`${errors.time ? 'border-red-500' : 'border-gray-300'} focus:border-primary-500 focus:ring-primary-500`}
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
              {t("Step1.Passengers")}
            </label>
            <Input 
              type="number"
              min="1"
              max="8"
              className="border-gray-300 focus:border-primary-500 focus:ring-primary-500" 
              value={formData.passengers}
              onChange={(e) => setFormData(prev => ({ ...prev, passengers: parseInt(e.target.value) || 1 }))}
            />
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-blue-700">
              <strong>{t("Step1.FreeCancellation")}</strong> {t("Step1.FreeCancellationDescription")}
            </p>
          </div>

          {/* Next Button */}
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base rounded-lg"
            onClick={handleNext}
            disabled={isLoading || calculatingDistance}
          >
            {isLoading || calculatingDistance ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("Step1.Processing")}
              </>
            ) : (
              <>
                {t("Step1.ContinueToVehicleSelection")}
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
            <p>{t("Footer.Support2")}</p>
            <p className="flex items-center justify-center gap-2 flex-wrap">
              <span>{process.env.NEXT_PUBLIC_PHONE_NUMBER}</span>
              <span>•</span>
              <span>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
