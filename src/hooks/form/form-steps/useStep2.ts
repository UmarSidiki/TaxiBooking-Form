"use client";

import { useEffect, useRef, useState } from "react";
import { useBookingForm } from "@/contexts/BookingFormContext";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useTheme } from "@/contexts/ThemeContext";

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
    distanceData,
    setCurrentStep,
    setDistanceData,
    setCalculatingDistance,
  } = useBookingForm();

  // Fetch distance if landing directly on step 2 with pickup/dropoff
  useEffect(() => {
    if (
      formData.bookingType === "destination" &&
      formData.pickup &&
      formData.dropoff &&
      !distanceData
    ) {
      const fetchDistance = async () => {
        setCalculatingDistance(true);
        try {
          const stopLocations = formData.stops.map(stop => stop.location).filter(location => location.trim());
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
        } finally {
          setCalculatingDistance(false);
        }
      };
      fetchDistance();
    }
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

  // Initialize Google Maps
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

          // If we have pickup and dropoff, show the route
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
    };

    if (settings) {
      initGoogleMaps();
    }
  }, [settings, formData.pickup, formData.dropoff, formData.stops]);

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

  const calculatePrice = (vehicle: (typeof vehicles)[0]) => {
    let totalPrice = 0;

    // Hourly booking calculation
    if (formData.bookingType === "hourly") {
      const pricePerHour = vehicle.pricePerHour || 30;
      const minimumHours = vehicle.minimumHours || 2;
      const hours = Math.max(formData.duration, minimumHours);
      totalPrice = pricePerHour * hours;
    }
    // Destination-based booking calculation
    else {
      if (!distanceData) {
        return vehicle.price;
      }
      const distancePrice = vehicle.pricePerKm * distanceData.distance.km;
      let oneWayPrice = vehicle.price + distancePrice;
      oneWayPrice = Math.max(oneWayPrice, vehicle.minimumFare);

      totalPrice = oneWayPrice;
      if (formData.tripType === "roundtrip") {
        const returnPercentage =
          vehicle.returnPricePercentage === undefined
            ? 100
            : vehicle.returnPricePercentage;
        totalPrice = oneWayPrice + oneWayPrice * (returnPercentage / 100);
      }
    }

    // Apply discount after all other calculations
    const discount = vehicle.discount === undefined ? 0 : vehicle.discount;
    if (discount > 0) {
      totalPrice = totalPrice * (1 - discount / 100);
    }

    return totalPrice;
  };

  const calculateOriginalPrice = (vehicle: (typeof vehicles)[0]) => {
    // Hourly booking - show price without discount
    if (formData.bookingType === "hourly") {
      const pricePerHour = vehicle.pricePerHour || 30;
      const minimumHours = vehicle.minimumHours || 2;
      const hours = Math.max(formData.duration, minimumHours);
      return pricePerHour * hours;
    }

    // Destination-based booking
    if (!distanceData) {
      return vehicle.price;
    }
    // Calculate without minimum fare applied - just base + distance
    const distancePrice = vehicle.pricePerKm * distanceData.distance.km;
    const oneWayPrice = vehicle.price + distancePrice;

    if (formData.tripType === "roundtrip") {
      // For round trip, show what it would cost at full price (200% of one-way)
      return oneWayPrice * 2;
    }

    return oneWayPrice;
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
    distanceData,

    // Functions
    calculatePrice,
    calculateOriginalPrice,
    handleVehicleSelect,
    handleBack,
  };
}