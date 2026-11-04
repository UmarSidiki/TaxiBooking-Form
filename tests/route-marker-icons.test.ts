import { describe, expect, it } from "vitest";
import {
  escapeXml,
  ROUTE_MARKER_SIZES,
  routeMarkerIcon,
  routeMarkerSvg,
} from "@/features/booking/lib/maps/route-marker-icons";

const tokens = { ink: "#123456", sheet: "#FEDCBA" };

describe("route marker icons", () => {
  it("draws the pickup as a ring in sheet with a 5px ink stroke", () => {
    const svg = routeMarkerSvg("pickup", tokens);

    expect(svg).toContain('fill="#FEDCBA"');
    expect(svg).toContain('stroke="#123456"');
    expect(svg).toContain('stroke-width="5"');
    expect(svg).toContain('r="11"');
    expect(svg).not.toContain("<text");
  });

  it("draws each stop as an ink disc with a sheet-coloured number", () => {
    const svg = routeMarkerSvg("stop", tokens, 2);

    expect(svg).toContain('r="13"');
    expect(svg).toContain('fill="#123456"');
    expect(svg).toContain('fill="#FEDCBA"');
    expect(svg).toContain('font-size="14"');
    expect(svg).toContain('font-weight="700"');
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain(">2</text>");
  });

  it("draws the drop-off as a 22px rounded ink square", () => {
    const svg = routeMarkerSvg("dropoff", tokens);

    expect(svg).toContain('<rect width="22" height="22" rx="4"');
    expect(svg).toContain('fill="#123456"');
  });

  it("escapes user-provided stop labels and tokens", () => {
    const svg = routeMarkerSvg("stop", { ink: "#000", sheet: "#fff" }, '1<&>"');

    expect(svg).toContain("1&lt;&amp;&gt;&quot;");
    expect(svg).not.toContain("1<&>");
    expect(escapeXml("<script>")).toBe("&lt;script&gt;");
    expect(escapeXml("it's")).toBe("it&apos;s");
  });

  it("reports the canvas size and centre anchor for every kind", () => {
    for (const kind of ["pickup", "stop", "dropoff"] as const) {
      const icon = routeMarkerIcon(kind, tokens, kind === "stop" ? 1 : undefined);
      const size = ROUTE_MARKER_SIZES[kind];

      expect(icon.width).toBe(size);
      expect(icon.height).toBe(size);
      expect(icon.anchorX).toBe(size / 2);
      expect(icon.anchorY).toBe(size / 2);
    }
  });

  it("returns a self-contained SVG data URL", () => {
    const icon = routeMarkerIcon("stop", tokens, 3);

    expect(icon.url.startsWith("data:image/svg+xml;charset=UTF-8,")).toBe(true);
    const decoded = decodeURIComponent(icon.url.split(",")[1]);
    expect(decoded).toContain('fill="#123456"');
    expect(decoded).toContain(">3</text>");
    expect(decoded).toContain(`width="${ROUTE_MARKER_SIZES.stop}"`);
  });
});
