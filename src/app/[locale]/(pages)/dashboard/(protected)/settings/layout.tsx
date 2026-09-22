import { SettingsDeskShell } from "@/features/settings/ui/settings-desk-shell";
import type { ReactNode } from "react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsDeskShell>{children}</SettingsDeskShell>;
}
