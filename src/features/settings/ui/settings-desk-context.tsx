"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useTranslations } from "next-intl";

import type { ISetting } from "@/features/settings/model";
import type { SettingsDeskPatch } from "@/features/settings/ui/settings-desk-props";
import { toPublicSettings } from "@/features/settings/lib/public-settings";
import { apiGet, apiPost } from "@/shared/http/api";

type SettingsDeskValue = {
  settings: Partial<ISetting>;
  patch: SettingsDeskPatch;
  setSettings: Dispatch<SetStateAction<Partial<ISetting>>>;
  isLoading: boolean;
  isFetching: boolean;
  loadError: boolean;
  notice: string | null;
  save: () => Promise<void>;
  refetch: () => Promise<void>;
  dismissNotice: () => void;
};

const SettingsDeskContext = createContext<SettingsDeskValue | null>(null);

function withModuleDefaults(data: Partial<ISetting>): Partial<ISetting> {
  return {
    ...data,
    enablePartners: data.enablePartners ?? false,
    enableDrivers: data.enableDrivers ?? false,
    enableAppointmentRequest: data.enableAppointmentRequest ?? false,
    enableEmbeddableForm: data.enableEmbeddableForm ?? false,
    enableFormBuilder: data.enableFormBuilder ?? false,
    partnerCashSettlement: data.partnerCashSettlement ?? "keep_cash",
    dispatchAssigneeMode: data.dispatchAssigneeMode ?? "exclusive",
    defaultPartnerMarginPercentage:
      data.defaultPartnerMarginPercentage ?? 20,
  };
}

export function SettingsDeskProvider({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const [settings, setSettings] = useState<Partial<ISetting>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsFetching(true);
    setLoadError(false);
    try {
      const data = await apiGet<{ success: boolean; data: Partial<ISetting> }>(
        "/api/settings?scope=full"
      );
      if (data.success) setSettings(withModuleDefaults(data.data));
      else setLoadError(true);
    } catch {
      setLoadError(true);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
    const onUpdate = (event: Event) => {
      const custom = event as CustomEvent<Partial<ISetting> | undefined>;
      if (custom.detail) setSettings(withModuleDefaults(custom.detail));
      else void refetch();
    };
    window.addEventListener("settingsUpdated", onUpdate);
    return () => window.removeEventListener("settingsUpdated", onUpdate);
  }, [refetch]);

  const patch: SettingsDeskPatch = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiPost<{
        success: boolean;
        data?: Partial<ISetting>;
      }>("/api/settings", settings);
      if (data.success) {
        if (data.data) setSettings(withModuleDefaults(data.data));
        window.dispatchEvent(
          new CustomEvent("settingsUpdated", {
            detail: data.data ? toPublicSettings(data.data) : undefined,
          })
        );
        setNotice(t("Dashboard.Settings.settings-saved-successfully"));
      } else {
        setNotice(t("Dashboard.Settings.failed-to-save-settings"));
      }
    } catch {
      setNotice(t("Dashboard.Settings.failed-to-save-settings"));
    } finally {
      setIsLoading(false);
    }
  }, [settings, t]);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const value = useMemo(
    () => ({
      settings,
      patch,
      setSettings,
      isLoading,
      isFetching,
      loadError,
      notice,
      save,
      refetch,
      dismissNotice,
    }),
    [
      settings,
      patch,
      isLoading,
      isFetching,
      loadError,
      notice,
      save,
      refetch,
      dismissNotice,
    ]
  );

  return (
    <SettingsDeskContext.Provider value={value}>
      {children}
    </SettingsDeskContext.Provider>
  );
}

export function useSettingsDesk() {
  const value = useContext(SettingsDeskContext);
  if (!value) {
    throw new Error("useSettingsDesk must be used inside SettingsDeskProvider");
  }
  return value;
}
