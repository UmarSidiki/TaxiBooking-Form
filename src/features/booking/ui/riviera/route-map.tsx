"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { rivieraLightStyle, rivieraDarkStyle } from "./map-styles";

const pickup = { lat: 46.2381, lng: 6.109 };
const dropoff = { lat: 46.2, lng: 6.15 };

function pickupIcon() {
  if (typeof google === "undefined") return undefined;
  return {
    url:
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><circle cx="9" cy="9" r="6" fill="#FBF9F5" stroke="#1C1A16" stroke-width="3"/></svg>',
      ),
    scaledSize: new google.maps.Size(18, 18),
  };
}

function dropoffIcon() {
  if (typeof google === "undefined") return undefined;
  return {
    url:
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><rect x="2" y="2" width="14" height="14" rx="3" fill="#A3381A" stroke="#FBF9F5" stroke-width="2"/></svg>',
      ),
    scaledSize: new google.maps.Size(18, 18),
  };
}

export function RivieraMap({ theme }: { theme?: "light" | "dark" }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !ref.current) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setOptions({ key: apiKey, v: "weekly" });
        const [mapsLib, routesLib] = await Promise.all([
          importLibrary("maps"),
          importLibrary("routes"),
        ]);
        if (cancelled || !ref.current) return;
        const isDark = document.documentElement.dataset.rivieraTheme === "dark";
        const map = new mapsLib.Map(ref.current, {
          center: pickup,
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: window.matchMedia("(min-width: 1024px)").matches,
          gestureHandling: "cooperative",
          styles: isDark ? rivieraDarkStyle : rivieraLightStyle,
        });
        mapRef.current = map;

        new google.maps.Marker({ position: pickup, map, icon: pickupIcon() });
        new google.maps.Marker({ position: dropoff, map, icon: dropoffIcon() });

        const renderer = new routesLib.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: { strokeColor: "#1C1A16", strokeWeight: 4 },
        });

        const service = new routesLib.DirectionsService();
        service.route(
          { origin: pickup, destination: dropoff, travelMode: google.maps.TravelMode.DRIVING },
          (result, status) => {
            if (status === "OK" && result) renderer.setDirections(result);
          },
        );
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const apply = () => {
      const map = mapRef.current;
      if (!map) return;
      const isDark = document.documentElement.dataset.rivieraTheme === "dark";
      map.setOptions({ styles: isDark ? rivieraDarkStyle : rivieraLightStyle });
    };
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-riviera-theme"] });
    return () => observer.disconnect();
  }, []);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--well)] p-4 text-sm text-[var(--ink2)]">
        <div>
          <div className="font-medium text-[var(--ink)]">Pick-up → Drop-off</div>
          <div className="mt-1">Trip summary</div>
        </div>
      </div>
    );
  }

  return <div ref={ref} className="h-full w-full" />;
}