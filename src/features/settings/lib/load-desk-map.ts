import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import type { ISetting } from "@/features/settings/model";
import {
  attachPolygonListeners,
  createDeskPolygon,
  DESK_MAP_POLYGON,
  polygonFromBounds,
} from "@/features/settings/lib/desk-map-polygon";

type LoadDeskMapArgs = {
  mapEl: HTMLDivElement;
  settings: Partial<ISetting>;
  onPolygonChange: (poly: google.maps.Polygon) => void;
  onDrawingComplete: () => void;
  onReady: () => void;
  onError: () => void;
  mapInstanceRef: { current: google.maps.Map | null };
  polygonRef: { current: google.maps.Polygon | null };
  drawingManagerRef: { current: google.maps.drawing.DrawingManager | null };
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
  drawingManagerRef,
}: LoadDeskMapArgs) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    onError();
    return;
  }

  setOptions({ key: apiKey, v: "weekly" });
  const [maps, drawing] = await Promise.all([
    importLibrary("maps"),
    importLibrary("drawing"),
  ]);

  const map = new maps.Map(mapEl, {
    center: {
      lat: settings.mapInitialLat ?? 46.2044,
      lng: settings.mapInitialLng ?? 6.1432,
    },
    zoom: 10,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });
  mapInstanceRef.current = map;

  const manager = new drawing.DrawingManager({
    drawingMode: null,
    drawingControl: false,
    polygonOptions: DESK_MAP_POLYGON,
  });
  manager.setMap(map);
  drawingManagerRef.current = manager;

  google.maps.event.addListener(
    manager,
    "overlaycomplete",
    (event: google.maps.drawing.OverlayCompleteEvent) => {
      if (event.type !== "polygon") return;
      manager.setDrawingMode(null);
      onDrawingComplete();
      polygonRef.current?.setMap(null);
      const newPoly = event.overlay as google.maps.Polygon;
      polygonRef.current = newPoly;
      attachPolygonListeners(newPoly, onPolygonChange);
      onPolygonChange(newPoly);
    }
  );

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
