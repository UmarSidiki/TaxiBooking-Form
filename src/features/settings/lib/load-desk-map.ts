import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { withMapsAttribution } from "@/features/booking/lib/maps/usage-attribution";
import type { ISetting } from "@/features/settings/model";
import {
  attachPolygonListeners,
  createDeskPolygon,
  polygonFromBounds,
} from "@/features/settings/lib/desk-map-polygon";
import {
  createDeskDrawController,
  type DeskDrawController,
} from "@/features/settings/lib/desk-map-draw";

type LoadDeskMapArgs = {
  mapEl: HTMLDivElement;
  settings: Partial<ISetting>;
  onPolygonChange: (poly: google.maps.Polygon) => void;
  onDrawingComplete: () => void;
  onReady: () => void;
  onError: () => void;
  mapInstanceRef: { current: google.maps.Map | null };
  polygonRef: { current: google.maps.Polygon | null };
  drawingControllerRef: { current: DeskDrawController | null };
};

export async function loadDeskMap({
  mapEl,
  settings,
  onPolygonChange,
  onDrawingComplete,
  onReady,
  onError,
  mapInstanceRef,
  polygonRef,
  drawingControllerRef,
}: LoadDeskMapArgs) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    onError();
    return;
  }

  setOptions({ key: apiKey, v: "weekly" });
  const maps = await importLibrary("maps");

  const map = new maps.Map(
    mapEl,
    withMapsAttribution({
      center: {
        lat: settings.mapInitialLat ?? 46.2044,
        lng: settings.mapInitialLng ?? 6.1432,
      },
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
  );
  mapInstanceRef.current = map;

  drawingControllerRef.current = createDeskDrawController({
    map,
    polygonRef,
    onPolygonChange,
    onFinished: onDrawingComplete,
  });

  if (settings.mapPolygonPoints && settings.mapPolygonPoints.length > 0) {
    const poly = createDeskPolygon(map, settings.mapPolygonPoints);
    polygonRef.current = poly;
    attachPolygonListeners(poly, onPolygonChange);
  } else if (settings.mapBounds) {
    const poly = polygonFromBounds(map, settings.mapBounds);
    polygonRef.current = poly;
    attachPolygonListeners(poly, onPolygonChange);
  }

  onReady();
}
