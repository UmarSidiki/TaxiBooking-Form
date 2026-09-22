import type { ISetting } from "@/features/settings/model";

export type SettingsDeskPatch = (
  key: keyof ISetting,
  value: ISetting[keyof ISetting]
) => void;
