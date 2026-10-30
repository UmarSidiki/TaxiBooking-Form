"use client";

import type { CSSProperties, ReactNode } from "react";

import { DeskChromeHeader } from "@/features/dashboard/ui/desk-chrome-header";
import { DeskPageChromeProvider } from "@/features/dashboard/ui/desk-page-chrome";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import { LanguageSwitcher } from "@/shared/ui/riviera/language-switcher";
import { RivieraThemeToggle } from "@/shared/ui/riviera/theme-toggle";

const shellStyle = {
  "--sidebar-width": "18rem",
  "--header-height": "3rem",
} as CSSProperties;

export function DeskShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="riviera min-h-screen">
      <SidebarProvider style={shellStyle}>
        <DeskPageChromeProvider>
          {sidebar}
          <SidebarInset>
            <div className="flex items-center justify-end gap-2 px-4 py-2">
              <LanguageSwitcher />
              <RivieraThemeToggle />
            </div>
            <DeskChromeHeader />
            <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </DeskPageChromeProvider>
    </SidebarProvider>
    </div>
  );
}
