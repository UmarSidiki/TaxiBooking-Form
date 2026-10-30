export const rivieraLightStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#F2EEE6" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5B554B" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FBF9F5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#E9E3D7" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#D9D1C2" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#E9E3D7" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#E9E3D7" }] },
];

export const rivieraDarkStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#14130F" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#B3AA9B" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#14130F" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#26231D" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#34302A" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#1C1A16" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#26231D" }] },
];