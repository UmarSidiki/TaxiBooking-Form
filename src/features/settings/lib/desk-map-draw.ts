import {
  attachPolygonListeners,
  DESK_MAP_POLYGON,
} from "@/features/settings/lib/desk-map-polygon";

const CLOSE_TOLERANCE_PX = 12;
const MIN_VERTICES = 3;

export type DeskDrawController = {
  start: () => void;
  cancel: () => void;
};

function pixelDistance(
  map: google.maps.Map,
  a: google.maps.LatLng,
  b: google.maps.LatLng
): number | null {
  const projection = map.getProjection();
  if (!projection) return null;
  const from = projection.fromLatLngToPoint(a);
  const to = projection.fromLatLngToPoint(b);
  if (!from || !to) return null;
  const scale = 2 ** (map.getZoom() ?? 0);
  return Math.hypot(from.x - to.x, from.y - to.y) * scale;
}

/**
 * Click-to-draw authoring for the service-area polygon, replacing the
 * deprecated google.maps.drawing DrawingManager (disabled Aug 2025). Click to
 * add points, click the first point or double-click to finish. The finished
 * polygon stays editable through the Polygon class's own handles.
 */
export function createDeskDrawController(input: {
  map: google.maps.Map;
  polygonRef: { current: google.maps.Polygon | null };
  onPolygonChange: (poly: google.maps.Polygon) => void;
  onFinished: () => void;
}): DeskDrawController {
  const { map, polygonRef, onPolygonChange, onFinished } = input;
  let listeners: google.maps.MapsEventListener[] = [];
  let vertices: google.maps.LatLng[] = [];
  let active = false;

  const teardown = () => {
    listeners.forEach((listener) => google.maps.event.removeListener(listener));
    listeners = [];
    map.setOptions({ draggableCursor: null });
  };

  const render = () => {
    if (vertices.length === 0) return;
    const existing = polygonRef.current;
    if (existing) {
      existing.setPath(vertices);
      return;
    }
    polygonRef.current = new google.maps.Polygon({
      map,
      paths: vertices,
      ...DESK_MAP_POLYGON,
      editable: false,
      draggable: false,
    });
  };

  const finish = () => {
    if (!active) return;
    active = false;
    teardown();
    vertices = [];

    const poly = polygonRef.current;
    if (!poly || poly.getPath().getLength() < MIN_VERTICES) {
      poly?.setMap(null);
      polygonRef.current = null;
    } else {
      poly.setOptions(DESK_MAP_POLYGON);
      attachPolygonListeners(poly, onPolygonChange);
      onPolygonChange(poly);
    }
    onFinished();
  };

  const cancel = () => {
    active = false;
    teardown();
    vertices = [];
    polygonRef.current?.setMap(null);
    polygonRef.current = null;
    onFinished();
  };

  const start = () => {
    if (active) return;

    polygonRef.current?.setMap(null);
    polygonRef.current = null;
    vertices = [];
    active = true;
    map.setOptions({ draggableCursor: "crosshair" });

    listeners.push(
      map.addListener("click", (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;

        if (vertices.length >= MIN_VERTICES) {
          const distance = pixelDistance(map, vertices[0], event.latLng);
          if (distance !== null && distance <= CLOSE_TOLERANCE_PX) {
            finish();
            return;
          }
        }

        vertices.push(event.latLng);
        render();
      })
    );

    listeners.push(
      map.addListener("dblclick", () => {
        // The two clicks that make up the double-click appended a duplicate
        // final vertex; drop it before finishing.
        if (vertices.length > MIN_VERTICES) vertices.pop();
        finish();
      })
    );
  };

  return { start, cancel };
}
