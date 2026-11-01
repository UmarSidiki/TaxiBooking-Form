import base from "./playwright.matrix.config";
export default {
  ...base,
  testMatch: ["sidebar-v2.spec.ts", "sidebar-brand.spec.ts", "drawer-matrix.spec.ts", "marketing-campaigns*.spec.ts", "admin-customers.spec.ts"],
};
