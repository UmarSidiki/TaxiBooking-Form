"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ISetting } from "@/models/settings";
import { useTranslations } from "next-intl";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

type MapBoundsLiteral = Required<NonNullable<ISetting["mapBounds"]>>;

interface MapTabProps {
  settings: Partial<ISetting>;
  handleMapSettingsChange: (
    key: keyof ISetting,
    value: ISetting[keyof ISetting]
  ) => void;
}

const MapTab: React.FC<MapTabProps> = ({
  settings,
  handleMapSettingsChange,
}) => {
  const t = useTranslations();
  const mapRef = useRef<HTMLDivElement | null>(null);

  // -- Refs for Google Maps Instances --
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

  // -- State --
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Preview for the rectangular bounds (calculated from the polygon)
  const [boundsPreview, setBoundsPreview] = useState<ISetting["mapBounds"] | null>(
    settings.mapBounds ?? null
  );

  // -- Helpers --

  // Convert Google LatLngBounds to your {north, south, east, west} format
  const toLiteral = (bounds: google.maps.LatLngBounds): MapBoundsLiteral => ({
    north: bounds.getNorthEast().lat(),
    east: bounds.getNorthEast().lng(),
    south: bounds.getSouthWest().lat(),
    west: bounds.getSouthWest().lng(),
  });

  // Extract simple lat/lng array from a Polygon object
  const getPolygonPath = (
    poly: google.maps.Polygon
  ): Array<{ lat: number; lng: number }> => {
    const path = poly.getPath();
    const len = path.getLength();
    const coordArray = [];
    for (let i = 0; i < len; i++) {
      const xy = path.getAt(i);
      coordArray.push({ lat: xy.lat(), lng: xy.lng() });
    }
    return coordArray;
  };

  // Calculate the rectangular box that encompasses the Polygon
  const getPolygonBounds = (poly: google.maps.Polygon): MapBoundsLiteral => {
    const paths = poly.getPath();
    const bounds = new google.maps.LatLngBounds();
    paths.forEach((p) => bounds.extend(p));
    return toLiteral(bounds);
  };

  // Updates parent state with both the specific points and the general bounds
  const updateParentSettings = (poly: google.maps.Polygon) => {
    const points = getPolygonPath(poly);
    const bounds = getPolygonBounds(poly);

    console.log("MapTab - Saving polygon:", {
      pointsCount: points.length,
      points: points,
      bounds: bounds
    });

    setBoundsPreview(bounds);
    
    // 1. Save the specific polygon shape
    handleMapSettingsChange("mapPolygonPoints", points);
    
    // 2. Save the rectangular bounds (Critical for backward compatibility)
    handleMapSettingsChange("mapBounds", bounds);
  };

  // Attaches listeners to a polygon so dragging points updates the state
  const attachPolygonListeners = (poly: google.maps.Polygon) => {
    const path = poly.getPath();

    // Listen for modifying specific points
    google.maps.event.addListener(path, "set_at", () => updateParentSettings(poly));
    google.maps.event.addListener(path, "insert_at", () => updateParentSettings(poly));
    google.maps.event.addListener(path, "remove_at", () => updateParentSettings(poly));
    
    // Listen for dragging the entire shape
    poly.addListener("dragend", () => updateParentSettings(poly));
  };

  // -- Initialization --

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setMapError(t("Dashboard.Settings.bounds-missing-key"));
      return;
    }

    let isMounted = true;
    setOptions({ key: apiKey, v: "weekly" });

    const initialize = async () => {
      try {
        // Load Maps and Drawing libraries
        const [maps, drawing] = await Promise.all([
          importLibrary("maps"),
          importLibrary("drawing"),
        ]);

        if (!isMounted || !mapRef.current) return;

        // 1. Setup Map
        const center = {
          lat: settings.mapInitialLat ?? 46.2044,
          lng: settings.mapInitialLng ?? 6.1432,
        };

        const map = new maps.Map(mapRef.current, {
          center,
          zoom: 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;

        // 2. Setup Drawing Manager (Polygon Mode)
        const manager = new drawing.DrawingManager({
          drawingMode: null, // Start disabled
          drawingControl: false, // Hide default UI
          polygonOptions: {
            editable: true,
            draggable: false,
            strokeColor: "#2563eb",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#2563eb",
            fillOpacity: 0.2,
          },
        });
        manager.setMap(map);
        drawingManagerRef.current = manager;

        // 3. Handle "Drawing Completed" event
        google.maps.event.addListener(
          manager,
          "overlaycomplete",
          (event: google.maps.drawing.OverlayCompleteEvent) => {
            if (event.type === "polygon") {
              // Stop drawing mode
              manager.setDrawingMode(null);
              setIsDrawing(false);

              // Remove any previous polygon
              if (polygonRef.current) {
                polygonRef.current.setMap(null);
              }

              // Capture the new polygon
              const newPoly = event.overlay as google.maps.Polygon;
              polygonRef.current = newPoly;

              // Setup listeners and save data
              attachPolygonListeners(newPoly);
              updateParentSettings(newPoly);
            }
          }
        );

        setMapReady(true);

        // 4. Render Existing Shape (if any)
        console.log("MapTab - Loading settings:", {
          hasPolygonPoints: !!settings.mapPolygonPoints,
          polygonPointsLength: settings.mapPolygonPoints?.length,
          hasBounds: !!settings.mapBounds
        });

        if (settings.mapPolygonPoints && settings.mapPolygonPoints.length > 0) {
          console.log("MapTab - Drawing polygon from points:", settings.mapPolygonPoints);
          // If we have exact points, draw the polygon
          const poly = new google.maps.Polygon({
            map: map,
            paths: settings.mapPolygonPoints,
            editable: true,
            draggable: false,
            strokeColor: "#2563eb",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#2563eb",
            fillOpacity: 0.2,
          });
          polygonRef.current = poly;
          attachPolygonListeners(poly);
        } else if (settings.mapBounds) {
            // Fallback: If we only have bounds (rectangle data), draw it as a polygon
            const b = settings.mapBounds;
            const fallbackPath = [
                { lat: b.north, lng: b.west },
                { lat: b.north, lng: b.east },
                { lat: b.south, lng: b.east },
                { lat: b.south, lng: b.west },
            ];
            const poly = new google.maps.Polygon({
                map: map,
                paths: fallbackPath,
                editable: true,
                draggable: false,
                strokeColor: "#2563eb",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#2563eb",
                fillOpacity: 0.2,
            });
            polygonRef.current = poly;
            attachPolygonListeners(poly);
        }

      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to load Google Maps", error);
        setMapError(t("Dashboard.Settings.bounds-load-error"));
      }
    };

    initialize();

    return () => {
      isMounted = false;
      if (polygonRef.current) polygonRef.current.setMap(null);
      if (drawingManagerRef.current) drawingManagerRef.current.setMap(null);
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.mapInitialLat, settings.mapInitialLng, t]);

  // -- Handlers --

  const handleStartDrawing = () => {
    if (!drawingManagerRef.current) return;
    
    // Clear existing shape before starting new one
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    // Set mode to POLYGON
    drawingManagerRef.current.setDrawingMode(
      google.maps.drawing.OverlayType.POLYGON
    );
    setIsDrawing(true);
    setBoundsPreview(null);
  };

  const handleClearBounds = () => {
    if (drawingManagerRef.current) drawingManagerRef.current.setDrawingMode(null);
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    setIsDrawing(false);
    setBoundsPreview(null);
    
    // Clear both settings
    handleMapSettingsChange("mapBounds", null);
    handleMapSettingsChange("mapPolygonPoints", null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Dashboard.Settings.map-configuration")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Initial Location Inputs */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.initial-location")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.initial-latitude")}
              </label>
              <Input
                type="number"
                step="any"
                placeholder="46.2044"
                value={settings.mapInitialLat ?? ""}
                onChange={(e) =>
                  handleMapSettingsChange(
                    "mapInitialLat",
                    parseFloat(e.target.value)
                  )
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.initial-longitude")}
              </label>
              <Input
                type="number"
                step="any"
                placeholder="6.1432"
                value={settings.mapInitialLng ?? ""}
                onChange={(e) =>
                  handleMapSettingsChange(
                    "mapInitialLng",
                    parseFloat(e.target.value)
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* Map Drawing Area */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.service-area-bounds")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("Dashboard.Settings.draw-service-area")}
          </p>

          <div className="h-96 rounded-lg border overflow-hidden relative">
            <div
              ref={mapRef}
              className={`h-full w-full ${mapReady ? "opacity-100" : "opacity-0"}`}
            />
            {!mapReady && !mapError && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                {t("Dashboard.Settings.loading-map")}
              </div>
            )}
            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-red-600 bg-red-50">
                {mapError}
              </div>
            )}
            
            {/* Drawing Helper Text */}
            {isDrawing && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-xs font-medium z-10 shadow-lg pointer-events-none">
                Click points to draw. Click first point or double-click to finish.
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleStartDrawing}
              disabled={!mapReady || !!mapError}
              variant={isDrawing ? "secondary" : "default"}
              className={isDrawing ? "animate-pulse" : ""}
            >
              {isDrawing ? "Drawing Active..." : "Draw Custom Shape"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleClearBounds}
              disabled={!boundsPreview && !isDrawing}
            >
              {t("Dashboard.Settings.bounds-clear")}
            </Button>
          </div>

          {/* Bounds Information Display */}
          {boundsPreview ? (
            <div>
              <p className="text-sm font-medium mb-2">
                {t("Dashboard.Settings.bounds-current")}
              </p>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">
                    {t("Dashboard.Settings.bounds-north")}
                  </dt>
                  <dd className="font-semibold">
                    {boundsPreview.north.toFixed(4)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("Dashboard.Settings.bounds-south")}
                  </dt>
                  <dd className="font-semibold">
                    {boundsPreview.south.toFixed(4)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("Dashboard.Settings.bounds-east")}
                  </dt>
                  <dd className="font-semibold">
                    {boundsPreview.east.toFixed(4)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("Dashboard.Settings.bounds-west")}
                  </dt>
                  <dd className="font-semibold">
                    {boundsPreview.west.toFixed(4)}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground mt-2 italic">
                * Note: Complex shapes are saved, but these numbers represent the bounding box.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("Dashboard.Settings.bounds-helper")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MapTab;