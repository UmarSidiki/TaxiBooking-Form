"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/shared/http/api";
import type { IVehicle } from "@/features/fleet/model";

export function useBookingVehicles() {
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const fetchVehicles = async () => {
        setVehiclesLoading(true);
        setVehiclesError(null);
        try {
          const data = await apiFetch<{ success: boolean; data: IVehicle[] }>(
            "/api/vehicles?isActive=true"
          );
          if (data.success) {
            setVehicles(data.data);
          } else {
            setVehiclesError("vehicles-load-error");
          }
        } catch {
          setVehiclesError("vehicles-load-error");
        } finally {
          setVehiclesLoading(false);
        }
      };
      void fetchVehicles();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return { vehicles, setVehicles, vehiclesLoading, vehiclesError };
}
