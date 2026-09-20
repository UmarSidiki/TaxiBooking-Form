"use client";

import { MapTabPanel } from "@/features/settings/ui/map-tab-panel";
import type { MapTabProps } from "@/features/settings/ui/map-tab-props";
import { useMapTab } from "@/features/settings/ui/use-map-tab";

export default function MapTab(props: MapTabProps) {
  const map = useMapTab(props);
  return <MapTabPanel {...map} />;
}
