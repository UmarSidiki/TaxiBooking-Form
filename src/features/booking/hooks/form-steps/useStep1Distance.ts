"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { DistanceData, FormData } from "@/contexts/BookingFormContext";
import {
  fetchBookingDistance,
  MIN_DISTANCE_QUERY_LENGTH,
} from "@/lib/maps/fetch-booking-distance";
import { DISTANCE_DEBOUNCE_MS } from "@/lib/maps/distance-debounce";

export function useStep1Distance({
  formData,
  googleMapRef,
  directionsRendererRef,
  setDistanceData,
  setCalculatingDistance,
}: {
  formData: FormData;
  googleMapRef: MutableRefObject<google.maps.Map | null>;
  directionsRendererRef: MutableRefObject<google.maps.DirectionsRenderer | null>;
  setDistanceData: Dispatch<SetStateAction<DistanceData | null>>;
  setCalculatingDistance: Dispatch<SetStateAction<boolean>>;
}) {
  const distanceCalculationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const calculateDistance = useCallback(
    async (
      origin: string,
      destination: string,
      stops: Array<{ location: string; order: number }> = [],
      isRoundTrip: boolean = false
    ) => {
      if (!origin || !destination) return;
      // Check for extremely short strings that might be invalid
      if (origin.length < MIN_DISTANCE_QUERY_LENGTH || destination.length < MIN_DISTANCE_QUERY_LENGTH) return;

      setCalculatingDistance(true);
      try {
        const { stopLocations, data } = await fetchBookingDistance(
          origin,
          destination,
          stops,
          isRoundTrip
        );
        if (data.success) {
          setDistanceData(data.data);

          // Update map route
          if (googleMapRef.current && window.google) {
            const directionsService = new google.maps.DirectionsService();

            const waypoints = stopLocations.map((location) => ({
              location: location,
              stopover: true,
            }));

            directionsService.route(
              {
                origin: origin,
                destination: destination,
                waypoints: waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (result, status) => {
                if (status === "OK" && result) {
                  if (!directionsRendererRef.current) {
                    directionsRendererRef.current =
                      new google.maps.DirectionsRenderer({
                        map: googleMapRef.current,
                        suppressMarkers: false,
                        polylineOptions: {
                          strokeColor: "var(--primary-color)",
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
        console.error("Error calculating distance:", error);
      } finally {
        setCalculatingDistance(false);
      }
    },
    [setCalculatingDistance, setDistanceData]
  );

  // Debounced distance calculation to prevent excessive API calls
  const debouncedCalculateDistance = useCallback(
    (
      origin: string,
      destination: string,
      stops: Array<{ location: string; order: number }> = [],
      isRoundTrip: boolean = false
    ) => {
      // Clear existing timer
      if (distanceCalculationTimerRef.current) {
        clearTimeout(distanceCalculationTimerRef.current);
      }

      // Set new timer
      distanceCalculationTimerRef.current = setTimeout(() => {
        calculateDistance(origin, destination, stops, isRoundTrip);
      }, DISTANCE_DEBOUNCE_MS); // 1s debounce — fewer /api/distance calls while typing
    },
    [calculateDistance]
  );

  // Effect to recalculate distance when stops change
  // Using useMemo to prevent unnecessary recalculations
  const stopsKey = useMemo(
    () => formData.stops.map(s => s.location).join('|'),
    [formData.stops]
  );

  useEffect(() => {
    // Only recalculate if we have pickup and dropoff
    if (formData.pickup && formData.dropoff && formData.bookingType === "destination") {
      // Only recalculate if all stops have locations (or no stops)
      const allStopsValid = formData.stops.length === 0 || 
        formData.stops.every(stop => stop.location.trim());
      
      const isPickupValid = formData.pickup.trim().length > 2;
      const isDropoffValid = formData.dropoff.trim().length > 2;

      if (allStopsValid && isPickupValid && isDropoffValid) {
        debouncedCalculateDistance(
          formData.pickup.trim(),
          formData.dropoff.trim(),
          formData.stops,
          formData.tripType === "roundtrip"
        );
      }
    }
  }, [
    formData.pickup,
    formData.dropoff,
    formData.bookingType,
    formData.tripType,
    stopsKey, // Use memoized key instead of inline calculation
    debouncedCalculateDistance,
  ]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (distanceCalculationTimerRef.current) {
        clearTimeout(distanceCalculationTimerRef.current);
      }
    };
  }, []);

  const handleInputBlur = (field: string) => {
    // Trigger distance calculation when both pickup and dropoff are filled
    if (
      (field === "pickup" || field === "dropoff") &&
      formData.pickup &&
      formData.dropoff
    ) {
      debouncedCalculateDistance(
        formData.pickup,
        formData.dropoff,
        formData.stops,
        formData.tripType === "roundtrip"
      );
    }
  };

  return {
    calculateDistance,
    handleInputBlur,
  };
}
