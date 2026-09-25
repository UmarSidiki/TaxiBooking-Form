"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getPolygonBounds,
  getPolygonPath,
} from "@/features/settings/lib/map-geometry";
import { loadDeskMap } from "@/features/settings/lib/load-desk-map";
import type { DeskDrawController } from "@/features/settings/lib/desk-map-draw";
import type { ISetting } from "@/features/settings/model";
import type { MapTabProps } from "@/features/settings/ui/map-tab-props";

export function useMapTab({
  settings,
  handleMapSettingsChange,
}: MapTabProps) {
  const t = useTranslations();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const drawingControllerRef = useRef<DeskDrawController | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [boundsPreview, setBoundsPreview] = useState<ISetting["mapBounds"] | null>(
    settings.mapBounds ?? null
  );

  const updateParentSettings = (poly: google.maps.Polygon) => {
    const bounds = getPolygonBounds(poly);
    setBoundsPreview(bounds);
    handleMapSettingsChange("mapPolygonPoints", getPolygonPath(poly));
    handleMapSettingsChange("mapBounds", bounds);
  };

  useEffect(() => {
    const mapEl = mapRef.current;
    if (!mapEl) return;
    let isMounted = true;

    loadDeskMap({
      mapEl,
      settings,
      onPolygonChange: updateParentSettings,
      onDrawingComplete: () => {
        if (isMounted) setIsDrawing(false);
      },
      onReady: () => {
        if (isMounted) setMapReady(true);
      },
      onError: () => {
        if (!isMounted) return;
        setMapError(
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            ? t("Dashboard.Settings.bounds-load-error")
            : t("Dashboard.Settings.bounds-missing-key")
        );
      },
      mapInstanceRef,
      polygonRef,
      drawingControllerRef,
    }).catch((error: unknown) => {
      console.error("Failed to load the service-area map:", error);
      if (!isMounted) return;
      setMapError(t("Dashboard.Settings.bounds-load-error"));
    });

    return () => {
      isMounted = false;
      drawingControllerRef.current?.cancel();
      drawingControllerRef.current = null;
      polygonRef.current?.setMap(null);
      polygonRef.current = null;
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.mapInitialLat, settings.mapInitialLng, t]);

  const handleStartDrawing = () => {
    const controller = drawingControllerRef.current;
    if (!controller) return;

    polygonRef.current?.setMap(null);
    polygonRef.current = null;
    setIsDrawing(true);
    setBoundsPreview(null);
    controller.start();
  };

  const handleClearBounds = () => {
    drawingControllerRef.current?.cancel();
    polygonRef.current?.setMap(null);
    polygonRef.current = null;
    setIsDrawing(false);
    setBoundsPreview(null);
    handleMapSettingsChange("mapBounds", null);
    handleMapSettingsChange("mapPolygonPoints", null);
  };

  return {
    t,
    mapRef,
    mapReady,
    mapError,
    isDrawing,
    boundsPreview,
    handleStartDrawing,
    handleClearBounds,
    handleMapSettingsChange,
    settings,
  };
}
