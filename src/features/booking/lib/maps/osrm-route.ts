export type LatLng = [number, number];

export type OsrmRouteResult = LatLng[] | null;

export async function fetchOsrmRoute(
  start: LatLng,
  end: LatLng,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 5000,
): Promise<OsrmRouteResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const res = await fetchImpl(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords)) return null;
    return coords.map((c: number[]) => [c[1], c[0]] as LatLng);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}