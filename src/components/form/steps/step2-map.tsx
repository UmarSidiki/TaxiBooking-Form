"use client";

import { Loader2 } from "lucide-react";
import type { RefObject } from "react";

export function Step2Map({
  mapRef,
  mapLoaded,
}: {
  mapRef: RefObject<HTMLDivElement | null>;
  mapLoaded: boolean;
}) {
  return (
        <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden bg-gray-200">
          <div ref={mapRef} className="w-full h-full" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
  );
}
