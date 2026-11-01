import type { LatLngLiteral } from "@/features/booking/context/booking-form-context";
import {
  routeMarkerIcon,
  type RouteMarkerIcon,
  type RouteMarkerKind,
  type RouteMarkerTokens,
} from "@/features/booking/lib/maps/route-marker-icons";

export const isDarkTheme = () => document.documentElement.dataset.rivieraTheme === "dark";

/** Reads a Riviera token from the nearest .riviera element so the map follows theme.css. */
export function token(el: Element, name: string) {
  const scope = el.closest(".riviera") ?? document.documentElement;
  return getComputedStyle(scope).getPropertyValue(name).trim();
}

export function mapTokens(el: Element): RouteMarkerTokens {
  return { ink: token(el, "--ink"), sheet: token(el, "--sheet") };
}

export function googleIcon(icon: RouteMarkerIcon): google.maps.Icon {
  return {
    url: icon.url,
    scaledSize: new google.maps.Size(icon.width, icon.height),
    anchor: new google.maps.Point(icon.anchorX, icon.anchorY),
  };
}

export function markerIcon(tokens: RouteMarkerTokens, kind: RouteMarkerKind, label?: number) {
  return googleIcon(routeMarkerIcon(kind, tokens, label));
}

export function polylineOptions(tokens: RouteMarkerTokens): google.maps.PolylineOptions {
  return { strokeColor: tokens.ink, strokeWeight: 5, strokeOpacity: 1 };
}

/** Keep the route clear of the desktop dock and the mobile top edge. */
export function routePadding(el: Element): google.maps.Padding {
  const desktop = window.matchMedia("(min-width: 1024px)").matches;
  const dock = desktop ? el.closest(".riviera")?.querySelector<HTMLElement>(".dock") : null;
  const bottom = dock ? Math.round(dock.getBoundingClientRect().height + 40) : 24;
  return { top: 24, right: 24, bottom, left: 24 };
}

/** A routable end: picked coordinates, or prefilled text that was never edited. */
export function routeEnd(
  text: string,
  latLng: LatLngLiteral | null | undefined,
): LatLngLiteral | string | null {
  if (latLng) return latLng;
  if (latLng === undefined && text.trim()) return text;
  return null;
}
