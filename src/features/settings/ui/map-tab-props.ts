import type { ISetting } from "@/features/settings/model";

export type MapTabProps = {
  settings: Partial<ISetting>;
  handleMapSettingsChange: (
    key: keyof ISetting,
    value: ISetting[keyof ISetting]
  ) => void;
};
