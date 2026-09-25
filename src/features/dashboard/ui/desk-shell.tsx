"use client";

import type { CSSProperties, ReactNode } from "react";

import { DeskChromeHeader } from "@/features/dashboard/ui/desk-chrome-header";
import { DeskPageChromeProvider } from "@/features/dashboard/ui/desk-page-chrome";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";

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
    <SidebarProvider style={shellStyle}>
      <DeskPageChromeProvider>
        {sidebar}
        <SidebarInset>
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
  );
}
