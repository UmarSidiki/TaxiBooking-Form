import type { Dispatch, SetStateAction } from "react";
import type { ISetting } from "@/features/settings/model";

export type SmtpTabProps = {
  settings: Partial<ISetting>;
  setSettings: Dispatch<SetStateAction<Partial<ISetting>>>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};
