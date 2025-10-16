"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useBookingForm } from '@/contexts/BookingFormContext';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from 'next-intl';

export function useStep1() {
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

  const createTargetUrl = () => {
    const locale = window.location.pathname.split('/')[1]; // Extract locale from URL path
    const params = new URLSearchParams({
      step: "2",
      bookingType: formData.bookingType,
      pickup: formData.pickup.trim(),
      date: formData.date,
      time: formData.time,
      passengers: String(formData.passengers),
      source: "embed_v1",
    });

    // Add dropoff and tripType only for destination bookings
    if (formData.bookingType === 'destination') {
      params.set("dropoff", formData.dropoff.trim());
      params.set(
        "tripType",
        formData.tripType === "roundtrip" ? "return" : "oneway"
      );
    }

    // Add duration only for hourly bookings
    if (formData.bookingType === 'hourly') {
      params.set("duration", String(formData.duration));
    }

    // Return the URL with locale path and parameters
    return `/${locale}?${params.toString()}`;
  };

  const redirectToStep2 = () => {
    if (validateStep()) {
      const targetUrl = createTargetUrl();
      const fullUrl = `${window.location.origin}${targetUrl}`;

      window.location.href = fullUrl;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(2);
    }
  };

  const handleBookingTypeChange = (bookingType: 'destination' | 'hourly') => {
    setFormData(prev => ({
      ...prev,
      bookingType,
      dropoff: bookingType === 'hourly' ? '' : prev.dropoff,
    }));
  };

  const handleTripTypeChange = (tripType: 'oneway' | 'roundtrip') => {
    setFormData(prev => ({ ...prev, tripType }));
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleInputBlur = (field: string) => {
    // Trigger distance calculation when both pickup and dropoff are filled
    if (field === 'pickup' && formData.pickup && formData.dropoff) {
      calculateDistance(formData.pickup, formData.dropoff, formData.tripType === 'roundtrip');
    } else if (field === 'dropoff' && formData.pickup && formData.dropoff) {
      calculateDistance(formData.pickup, formData.dropoff, formData.tripType === 'roundtrip');
    }
  };

  return {
    // State
    mapLoaded,
    mapRef,
    pickupInputRef,
    dropoffInputRef,

    // Context values
    formData,
    setFormData,
    errors,
    distanceData,
    calculatingDistance,
    isLoading,

    // Functions
    validateStep,
    handleNext,
    redirectToStep2, // New function for redirecting to step 2
    setCurrentStep,
    handleBookingTypeChange,
    handleTripTypeChange,
    handleInputChange,
    handleInputBlur,
  };
}