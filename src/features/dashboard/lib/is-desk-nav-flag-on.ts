import type { ISetting } from "@/features/settings/model";
import type { DeskNavFlag } from "@/features/dashboard/lib/sidebar-nav";

export function isDeskNavFlagOn(
  flag: DeskNavFlag | undefined,
  settings: Partial<ISetting>
): boolean {
  if (!flag) return true;
  if (flag === "drivers") return settings.enableDrivers ?? false;
  if (flag === "partners") return settings.enablePartners ?? false;
  if (flag === "formBuilder") return settings.enableFormBuilder !== false;
  return settings.enableEmbeddableForm !== false;
}
