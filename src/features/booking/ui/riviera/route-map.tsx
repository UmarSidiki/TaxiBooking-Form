"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { useBookingForm, type LatLngLiteral } from "@/features/booking/context/booking-form-context";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/features/booking/lib/maps/map-defaults";
import { rivieraDarkStyle, rivieraLightStyle } from "./map-styles";

export const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

const isDarkTheme = () => document.documentElement.dataset.rivieraTheme === "dark";

/** Reads a Riviera token from the nearest .riviera element so the map follows theme.css. */
function token(el: Element, name: string) {
  const scope = el.closest(".riviera") ?? document.documentElement;
  return getComputedStyle(scope).getPropertyValue(name).trim();
}

function svgIcon(svg: string, size: number): google.maps.Icon {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}

function markerIcons(el: Element) {
  const ink = token(el, "--ink");
  const sheet = token(el, "--sheet");
  return {
    pickup: svgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><circle cx="9" cy="9" r="6" fill="${sheet}" stroke="${ink}" stroke-width="3"/></svg>`, 18),
    dropoff: svgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><circle cx="9" cy="9" r="7" fill="${ink}" stroke="${sheet}" stroke-width="2"/></svg>`, 18),
  };
}

/** A routable end: picked coordinates, or prefilled text that was never edited. */
function routeEnd(text: string, latLng: LatLngLiteral | null | undefined): LatLngLiteral | string | null {
  if (latLng) return latLng;
  if (latLng === undefined && text.trim()) return text;
  return null;
}

/** Step 1 route map. Renders a compact text summary when Google Maps is unavailable. */
export function RivieraMap() {
  const t = useTranslations("Riviera");
  const { formData, distanceData } = useBookingForm();
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const routeRef = useRef<{ renderer: google.maps.DirectionsRenderer; service: google.maps.DirectionsService } | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
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
          renderer: new routes.DirectionsRenderer({ map, suppressMarkers: true, preserveViewport: false }),
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
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      route.renderer.set("directions", null);
    };
    clear();
    const origin = routeEnd(formData.pickup, formData.pickupLatLng);
    const destination = routeEnd(formData.dropoff, formData.dropoffLatLng);
    if (!origin || !destination) return;
    let stale = false;
    const waypoints = formData.stops
      .filter((s) => s.location)
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ location: s.location, stopover: true }));
    route.service
      .route({ origin, destination, waypoints, travelMode: google.maps.TravelMode.DRIVING })
      .then((result) => {
        const legs = result.routes[0]?.legs;
        if (stale || !legs?.length) return;
        route.renderer.setOptions({ polylineOptions: { strokeColor: token(el, "--ink"), strokeWeight: 4, strokeOpacity: 1 } });
        route.renderer.setDirections(result);
        const icons = markerIcons(el);
        markersRef.current = [
          new google.maps.Marker({ map, position: legs[0].start_location, icon: icons.pickup, clickable: false }),
          new google.maps.Marker({ map, position: legs[legs.length - 1].end_location, icon: icons.dropoff, clickable: false }),
        ];
      })
      // NOT_FOUND / ZERO_RESULTS: no drivable route, so the map simply shows none.
      .catch(() => {
        if (!stale) clear();
      });
    return () => {
      stale = true;
    };
  }, [ready, formData.pickup, formData.dropoff, formData.pickupLatLng, formData.dropoffLatLng, formData.stops]);

  // Follow the Riviera light/dark toggle.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      mapRef.current?.setOptions({ styles: isDarkTheme() ? rivieraDarkStyle : rivieraLightStyle });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-riviera-theme"] });
    return () => observer.disconnect();
  }, []);

  if (failed) {
    return (
      <div className="map-fallback" role="status">
        <b>{formData.pickup || t("pickup")}</b>
        <span aria-hidden="true"> → </span>
        <b>{formData.dropoff || t("dropoff")}</b>
        {distanceData ? (
          <span className="num"> · {distanceData.distance.text} · {distanceData.duration.text}</span>
        ) : null}
      </div>
    );
  }

  return <div ref={ref} className="h-full w-full" aria-label={t("mapLabel")} role="img" />;
}
