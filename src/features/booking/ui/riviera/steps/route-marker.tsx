export type RouteMarkerKind = "pickup" | "stop" | "dropoff";

export function RouteMarker({
  kind,
  number,
}: {
  kind: RouteMarkerKind;
  number?: number;
}) {
  return (
    <span className="route-rail__mark" data-route-marker={kind} aria-hidden="true">
      {kind === "stop" ? (
        <span className="route-rail__num">{number}</span>
      ) : (
        <span className={kind === "pickup" ? "route-rail__dot" : "route-rail__pin"} />
      )}
    </span>
  );
}
