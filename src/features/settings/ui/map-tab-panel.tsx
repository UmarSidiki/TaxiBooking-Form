"use client";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { useMapTab } from "@/features/settings/ui/use-map-tab";

type Map = ReturnType<typeof useMapTab>;

export function MapTabPanel({
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
}: Map) {
  return (
    <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.initial-location")}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
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
              <label className="mb-2 block text-sm font-medium">
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

        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.service-area-bounds")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("Dashboard.Settings.draw-service-area")}
          </p>
          <div className="relative h-96 overflow-hidden rounded-lg border">
            <div
              ref={mapRef}
              className={`h-full w-full ${mapReady ? "opacity-100" : "opacity-0"}`}
            />
            {!mapReady && !mapError ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                {t("Dashboard.Settings.loading-map")}
              </div>
            ) : null}
            {mapError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 px-4 text-center text-sm text-destructive">
                {mapError}
              </div>
            ) : null}
            {isDrawing ? (
              <div className="pointer-events-none absolute start-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-sidebar px-4 py-2 text-xs font-medium text-sidebar-foreground shadow-lg">
                {t("Dashboard.Settings.draw_hint")}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleStartDrawing}
              disabled={!mapReady || !!mapError}
              variant={isDrawing ? "secondary" : "default"}
              className="min-h-11"
            >
              {isDrawing
                ? t("Dashboard.Settings.drawing_active")
                : t("Dashboard.Settings.draw_shape")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClearBounds}
              disabled={!boundsPreview && !isDrawing}
              className="min-h-11"
            >
              {t("Dashboard.Settings.bounds-clear")}
            </Button>
          </div>
          {boundsPreview ? (
            <div>
              <p className="mb-2 text-sm font-medium">
                {t("Dashboard.Settings.bounds-current")}
              </p>
              <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                {(
                  [
                    ["bounds-north", boundsPreview.north],
                    ["bounds-south", boundsPreview.south],
                    ["bounds-east", boundsPreview.east],
                    ["bounds-west", boundsPreview.west],
                  ] as const
                ).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-muted-foreground">
                      {t(`Dashboard.Settings.${key}`)}
                    </dt>
                    <dd className="font-semibold">{value.toFixed(4)}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("Dashboard.Settings.bounds_note")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("Dashboard.Settings.bounds-helper")}
            </p>
          )}
        </div>
    </div>
  );
}
