import type { ISetting } from "@/features/settings/model";
import type { Dispatch, SetStateAction } from "react";

export type SettingsDeskPatch = (
  key: keyof ISetting,
  value: ISetting[keyof ISetting]
) => void;

export type SettingsDeskPanelsProps = {
  settings: Partial<ISetting>;
  patch: SettingsDeskPatch;
  setSettings: Dispatch<SetStateAction<Partial<ISetting>>>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};
