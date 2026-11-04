import { afterEach, describe, expect, it, vi } from "vitest";

const loader = vi.hoisted(() => ({ setOptions: vi.fn(), importLibrary: vi.fn(async () => ({ Autocomplete: class {} })) }));
vi.mock("@googlemaps/js-api-loader", () => loader);

import { addressInputProps, loadPlacesLibrary, scrollAddressIntoView } from "@/features/booking/lib/maps/place-autocomplete";
import { isPlaceInServiceArea } from "@/features/booking/lib/maps/is-place-in-service-area";

const place = (lat: number, lng: number) =>
  ({ formatted_address: "Somewhere", geometry: { location: { lat: () => lat, lng: () => lng } } }) as unknown as google.maps.places.PlaceResult;
const square = [
  { lat: 46, lng: 6 },
  { lat: 46, lng: 7 },
  { lat: 47, lng: 7 },
  { lat: 47, lng: 6 },
];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  loader.setOptions.mockClear();
  loader.importLibrary.mockClear();
});

describe("Places autocomplete", () => {
  it("falls back to plain inputs when no maps key is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
    expect(await loadPlacesLibrary()).toBeNull();
    expect(loader.importLibrary).not.toHaveBeenCalled();
  });

  it("loads the places library with the key when present", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "test-key");
    expect(await loadPlacesLibrary()).toHaveProperty("Autocomplete");
    expect(loader.setOptions).toHaveBeenCalledWith({ key: "test-key", v: "weekly" });
    expect(loader.importLibrary).toHaveBeenCalledWith("places");
  });

  it("reads lat/lng from a selected place and checks the service area", () => {
    expect(isPlaceInServiceArea(place(46.5, 6.5), { mapPolygonPoints: square })).toBe(true);
    expect(isPlaceInServiceArea(place(48, 6.5), { mapPolygonPoints: square })).toBe(false);
    expect(isPlaceInServiceArea({} as google.maps.places.PlaceResult, { mapPolygonPoints: square })).toBe(false);
    expect(isPlaceInServiceArea(place(48, 6.5), undefined)).toBe(true);
  });

  it("uses mobile-safe input attributes and scrolls the field above the keyboard", () => {
    expect(addressInputProps).toMatchObject({ inputMode: "text", autoComplete: "off", spellCheck: false });
    vi.useFakeTimers();
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }), setTimeout });
    const input = { scrollIntoView: vi.fn() } as unknown as HTMLElement;
    scrollAddressIntoView(input);
    vi.runAllTimers();
    expect(input.scrollIntoView).toHaveBeenCalledWith({ block: "start", behavior: "smooth" });
    vi.useRealTimers();
  });
});
