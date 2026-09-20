"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/features/booking/lib/maps/map-defaults";
import type { FormData } from "@/features/booking/context/booking-form-context";
import type { ISetting } from "@/features/settings/model";
import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from "react";
import { useEffect } from "react";

export function useStep3Map({
  mapRef,
  googleMapRef,
  directionsRendererRef,
  settings,
  formData,
  setMapLoaded,
}: {
  mapRef: RefObject<HTMLDivElement | null>;
  googleMapRef: MutableRefObject<google.maps.Map | null>;
  directionsRendererRef: MutableRefObject<google.maps.DirectionsRenderer | null>;
  settings: Partial<ISetting> | null | undefined;
  formData: FormData;
  setMapLoaded: Dispatch<SetStateAction<boolean>>;
}) {
  // Initialize Google Maps ONCE
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
              : DEFAULT_MAP_CENTER;

          googleMapRef.current = new maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: DEFAULT_MAP_ZOOM,
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
    };

    // Only initialize once when settings are available
    if (settings && !googleMapRef.current) {
      initGoogleMaps();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]); // Only run when settings change, not on every formData change
}
