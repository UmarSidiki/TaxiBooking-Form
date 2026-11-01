import base from "./playwright.matrix.config";
// Palette v2: surfaces, presets, custom palette, plus first paint and step 1 regressions.
export default {
  ...base,
  testMatch: ["palette-v2.spec.ts", "palette-first-paint.spec.ts", "route-line.spec.ts", "step1-location-behaviour.spec.ts", "dock.spec.ts", "sidebar-v2.spec.ts"],
};
