"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { useBookingForm } from "@/features/booking/context/booking-form-context";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/features/booking/lib/maps/map-defaults";
import type { RouteMarkerKind } from "@/features/booking/lib/maps/route-marker-icons";
import { rivieraDarkStyle, rivieraLightStyle } from "./map-styles";
import {
  isDarkTheme,
  mapTokens,
  markerIcon,
  polylineOptions,
  routeEnd,
  routePadding,
} from "./route-map-paint";

export const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

type DrawnMarker = { marker: google.maps.Marker; kind: RouteMarkerKind; label?: number };

/** Step 1 route map. Renders a compact text summary when Google Maps is unavailable. */
export function RivieraMap() {
  const t = useTranslations("Riviera");
  const { formData, distanceData } = useBookingForm();
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const routeRef = useRef<{ renderer: google.maps.DirectionsRenderer; service: google.maps.DirectionsService } | null>(null);
  const markersRef = useRef<DrawnMarker[]>([]);
  const [failed, setFailed] = useState(!GOOGLE_MAPS_KEY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !ref.current) return;
    let cancelled = false;
    (async () => {
      try {
        setOptions({ key: GOOGLE_MAPS_KEY, v: "weekly" });
        const [maps, routes] = await Promise.all([importLibrary("maps"), importLibrary("routes")]);
        if (cancelled || !ref.current) return;
        const map = new maps.Map(ref.current, {
          center: DEFAULT_MAP_CENTER,
          zoom: DEFAULT_MAP_ZOOM,
          disableDefaultUI: true,
          zoomControl: window.matchMedia("(min-width: 1024px)").matches,
          gestureHandling: "cooperative",
          styles: isDarkTheme() ? rivieraDarkStyle : rivieraLightStyle,
        });
        mapRef.current = map;
        routeRef.current = {
          service: new routes.DirectionsService(),
          renderer: new routes.DirectionsRenderer({ map, suppressMarkers: true, preserveViewport: true }),
        };
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Draw the driving route once both ends are real places: a picked suggestion
  // (coordinates) or an address that arrived prefilled. Half-typed text never routes.
  useEffect(() => {
    const map = mapRef.current;
    const route = routeRef.current;
    const el = ref.current;
    if (!ready || !map || !route || !el) return;

    const clear = () => {
      markersRef.current.forEach(({ marker }) => marker.setMap(null));
      markersRef.current = [];
      route.renderer.set("directions", null);
    };
    clear();

    // Hourly rides have no route: show only where the driver picks up.
    if (formData.bookingType === "hourly") {
      if (formData.pickupLatLng) {
        const marker = new google.maps.Marker({
          map,
          position: formData.pickupLatLng,
          clickable: false,
          zIndex: 20,
          icon: markerIcon(mapTokens(el), "pickup"),
        });
        markersRef.current.push({ marker, kind: "pickup" });
        map.panTo(formData.pickupLatLng);
      }
      return;
    }

    const origin = routeEnd(formData.pickup, formData.pickupLatLng);
    const destination = routeEnd(formData.dropoff, formData.dropoffLatLng);
    if (!origin || !destination) return;

    const stops = formData.stops
      .filter((stop) => stop.location)
      .sort((a, b) => a.order - b.order);
    const waypoints = stops.map((stop) => ({ location: stop.location, stopover: true }));
    let stale = false;

    route.service
      .route({ origin, destination, waypoints, travelMode: google.maps.TravelMode.DRIVING })
      .then((result) => {
        const legs = result.routes[0]?.legs;
        if (stale || !legs?.length) return;
        const tokens = mapTokens(el);
        route.renderer.setOptions({ polylineOptions: polylineOptions(tokens) });
        route.renderer.setDirections(result);

        const draw = (kind: RouteMarkerKind, position: google.maps.LatLng, label?: number) => {
          const marker = new google.maps.Marker({
            map,
            position,
            clickable: false,
            zIndex: kind === "stop" ? 10 : 20,
            icon: markerIcon(tokens, kind, label),
          });
          markersRef.current.push({ marker, kind, label });
        };

        draw("pickup", legs[0].start_location);
        stops.forEach((_, index) => {
          const leg = legs[index];
          if (leg) draw("stop", leg.end_location, index + 1);
        });
        draw("dropoff", legs[legs.length - 1].end_location);

        const bounds = result.routes[0]?.bounds;
        if (bounds) map.fitBounds(bounds, routePadding(el));
      })
      // NOT_FOUND / ZERO_RESULTS: no drivable route, so the map simply shows none.
      .catch(() => {
        if (!stale) clear();
      });

    return () => {
      stale = true;
    };
  }, [ready, formData.bookingType, formData.pickup, formData.dropoff, formData.pickupLatLng, formData.dropoffLatLng, formData.stops]);

  // Follow the Riviera light/dark toggle and palette swaps: repaint the map,
  // the route stroke and the marker icons from the new tokens.
  useEffect(() => {
    if (!ready) return;
    const el = ref.current;
    const map = mapRef.current;
    if (!el || !map) return;
    const repaint = () => {
      map.setOptions({ styles: isDarkTheme() ? rivieraDarkStyle : rivieraLightStyle });
      const tokens = mapTokens(el);
      routeRef.current?.renderer.setOptions({ polylineOptions: polylineOptions(tokens) });
      for (const drawn of markersRef.current) {
        drawn.marker.setIcon(markerIcon(tokens, drawn.kind, drawn.label));
      }
    };
    const observer = new MutationObserver(repaint);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-riviera-theme", "data-palette"],
    });
    return () => observer.disconnect();
  }, [ready]);

  if (failed) {
    return (
      <div className="map-fallback" role="status" data-map-mode={formData.bookingType}>
        <b>{formData.pickup || t("pickup")}</b>
        {formData.bookingType === "hourly" ? null : (
          <>
            <span aria-hidden="true"> → </span>
            <b data-testid="map-fallback-dropoff">{formData.dropoff || t("dropoff")}</b>
          </>
        )}
        {formData.bookingType === "destination" && distanceData ? (
          <span className="num"> · {distanceData.distance.text} · {distanceData.duration.text}</span>
        ) : null}
      </div>
    );
  }

  return <div ref={ref} data-map-mode={formData.bookingType} className="h-full w-full" aria-label={t("mapLabel")} role="img" />;
}
