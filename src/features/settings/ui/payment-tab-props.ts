"use client";

import type { ISetting } from "@/models/settings";
import type { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";

export type PaymentTabFieldsProps = {
  settings: Partial<ISetting>;
  handleMapSettingsChange: (
    key: keyof ISetting,
    value: string | number | string[] | boolean
  ) => void;
  t: ReturnType<typeof useTranslations>;
  selectedGateway: "stripe" | "multisafepay";
  setSelectedGateway: Dispatch<SetStateAction<"stripe" | "multisafepay">>;
};
