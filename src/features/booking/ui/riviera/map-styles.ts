// Neutral grey map styles matching the Riviera palette (riviera-theme.css).
// Google Maps needs literal colours here; keep them in step with the tokens.
const quiet: google.maps.MapTypeStyle[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

export const rivieraLightStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#F5F5F5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5C5C5C" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#E5E5E5" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#E5E5E5" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#DADADA" }] },
  ...quiet,
];

export const rivieraDarkStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1A1A1A" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#A1A1A1" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#111111" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2A2A2A" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#222222" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3A3A3A" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0E0E0E" }] },
  ...quiet,
];
