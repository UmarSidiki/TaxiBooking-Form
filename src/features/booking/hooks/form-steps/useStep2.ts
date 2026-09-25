"use client";

import { useEffect, useRef, useState } from "react";
import { useBookingForm } from "@/features/booking/context/booking-form-context";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useTheme } from "@/features/settings/context/theme-context";
import { calculateBookingPrice } from "@/features/payments/lib/fare/calculate-booking-price";

export function useStep2() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const { settings } = useTheme();

  const {
    formData,
    setFormData,
    vehicles,
    setVehicles,
    vehiclesLoading,
    vehiclesError,
    distanceData,
    setCurrentStep,
    setDistanceData,
    setCalculatingDistance,
    calculatingDistance,
  } = useBookingForm();

  // Fetch distance only if step 1 did not already (e.g. user landed on step 2 directly)
  const step2DistanceFetchedRef = useRef(false);
  useEffect(() => {
    if (
      step2DistanceFetchedRef.current ||
      distanceData ||
      formData.bookingType !== "destination" ||
      !formData.pickup ||
      !formData.dropoff
    ) {
      return;
    }

    step2DistanceFetchedRef.current = true;

    const fetchDistance = async () => {
      setCalculatingDistance(true);
      try {
        const stopLocations = formData.stops
          .map((stop) => stop.location)
          .filter((location) => location.trim());
        const res = await fetch("/api/distance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: formData.pickup,
            destination: formData.dropoff,
            stops: stopLocations,
            isRoundTrip: formData.tripType === "roundtrip",
          }),
        });
        const data = await res.json();
        if (data.success) setDistanceData(data.data);
      } catch (err) {
        console.error("Error fetching distance in Step2:", err);
        step2DistanceFetchedRef.current = false;
      } finally {
        setCalculatingDistance(false);
      }
    };
    fetchDistance();
  }, [
    formData.bookingType,
    formData.pickup,
    formData.dropoff,
    formData.stops,
    formData.tripType,
    distanceData,
    setDistanceData,
    setCalculatingDistance,
  ]);

  // Initialize Google Maps ONCE - deferred
  useEffect(() => {
    // Only initialize if map container is present
    if (!mapRef.current) return;
    
    // Defer map loading for performance
    const timeoutId = setTimeout(async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn("Google Maps API key not configured");
        setMapLoaded(true); // Still mark as loaded to remove loader
        return;
      }

      try {
        setOptions({
          key: apiKey,
          v: "weekly",
        });

        const [maps, routes] = await Promise.all([
          importLibrary("maps"),
          importLibrary("routes"),
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
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          setMapLoaded(true);

          // If we have pickup and dropoff, show the route (only on initial load)
          if (formData.pickup && formData.dropoff) {
            const directionsService = new routes.DirectionsService();

            const waypoints = formData.stops
              .filter(stop => stop.location.trim())
              .map(stop => ({
                location: stop.location,
                stopover: true,
              }));

            directionsService.route(
              {
                origin: formData.pickup,
                destination: formData.dropoff,
                waypoints: waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (
                result: google.maps.DirectionsResult | null,
                status: google.maps.DirectionsStatus
              ) => {
                if (status === "OK" && result && googleMapRef.current) {
                  if (!directionsRendererRef.current) {
                    directionsRendererRef.current =
                      new routes.DirectionsRenderer({
                        map: googleMapRef.current,
                        suppressMarkers: false,
                        polylineOptions: {
                          strokeColor: "var(--primary-color)",
                          strokeWeight: 4,
                        },
                      });
                  }
                  if (directionsRendererRef.current) {
                    directionsRendererRef.current.setDirections(result);
                  }
                }
              }
            );
          }
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    }, 300); // 300ms delay to prioritize initial render

    return () => clearTimeout(timeoutId);
  }, [settings, formData.pickup, formData.dropoff, formData.stops]); // Only run when settings change, not on every formData change

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch("/api/vehicles?isActive=true");
        const data = await response.json();
        if (data.success) {
          setVehicles(data.data);
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      }
    };

    fetchVehicles();
  }, [setVehicles]);

  const priceFor = (vehicle: (typeof vehicles)[0]) =>
    calculateBookingPrice(
      vehicle,
      {
        bookingType: formData.bookingType,
        tripType: formData.tripType,
        duration: formData.duration,
        pickup: formData.pickup,
        dropoff: formData.dropoff,
        stops: formData.stops,
        childSeats: formData.childSeats,
        babySeats: formData.babySeats,
      },
      {
        enableTax: settings?.enableTax ?? false,
        taxPercentage: settings?.taxPercentage ?? 0,
        taxIncluded: settings?.taxIncluded ?? false,
      },
      distanceData?.distance.km
    );

  const calculatePrice = (vehicle: (typeof vehicles)[0]) =>
    priceFor(vehicle).total;

  const calculateOriginalPrice = (vehicle: (typeof vehicles)[0]) => {
    const { vehiclePrice, extrasPrice } = priceFor(vehicle).breakdown;
    return vehiclePrice + extrasPrice;
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setFormData((prev) => ({ ...prev, selectedVehicle: vehicleId }));
    setCurrentStep(3);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  return {
    // State
    mapLoaded,
    mapRef,

    // Context values
    formData,
    vehicles,
    vehiclesLoading,
    vehiclesError,
    distanceData,

    // Tax settings
    enableTax: settings?.enableTax ?? false,
    taxPercentage: settings?.taxPercentage ?? 0,
    taxIncluded: settings?.taxIncluded ?? false,

    // Functions
    calculatePrice,
    calculateOriginalPrice,
    handleVehicleSelect,
    handleBack,
    calculatingDistance,
  };
}