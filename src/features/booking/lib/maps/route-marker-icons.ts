export type RouteMarkerKind = "pickup" | "stop" | "dropoff";

export type RouteMarkerTokens = { ink: string; sheet: string };

export type RouteMarkerIcon = {
  url: string;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
};

/**
 * Outer canvas per marker, in CSS pixels. The pickup ring includes its 5px
 * stroke (r 11 + 2.5), the stop is a 26px disc and the drop-off a 22px square.
 */
export const ROUTE_MARKER_SIZES: Record<RouteMarkerKind, number> = {
  pickup: 28,
  stop: 26,
  dropoff: 22,
};

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function escapeXml(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (character) => XML_ESCAPES[character]);
}

/** Ring for pickup, numbered ink disc for stops, rounded ink square for drop-off. */
export function routeMarkerSvg(
  kind: RouteMarkerKind,
  tokens: RouteMarkerTokens,
  label?: string | number,
): string {
  const ink = escapeXml(tokens.ink);
  const sheet = escapeXml(tokens.sheet);
  const size = ROUTE_MARKER_SIZES[kind];
  const center = size / 2;
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

  if (kind === "pickup") {
    return `${open}<circle cx="${center}" cy="${center}" r="11" fill="${sheet}" stroke="${ink}" stroke-width="5"/></svg>`;
  }

  if (kind === "dropoff") {
    return `${open}<rect width="22" height="22" rx="4" fill="${ink}"/></svg>`;
  }

  const text =
    label === undefined
      ? ""
      : `<text x="${center}" y="${center + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="${sheet}">${escapeXml(label)}</text>`;
  return `${open}<circle cx="${center}" cy="${center}" r="13" fill="${ink}"/>${text}</svg>`;
}

export function routeMarkerIcon(
  kind: RouteMarkerKind,
  tokens: RouteMarkerTokens,
  label?: string | number,
): RouteMarkerIcon {
  const size = ROUTE_MARKER_SIZES[kind];
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(routeMarkerSvg(kind, tokens, label))}`,
    width: size,
    height: size,
    anchorX: size / 2,
    anchorY: size / 2,
  };
}
