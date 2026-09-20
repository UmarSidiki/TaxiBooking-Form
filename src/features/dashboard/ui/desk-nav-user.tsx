"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

import { SidebarMenu, SidebarMenuItem } from "@/shared/ui/sidebar";
import LogoutButton from "@/features/auth/ui/logout-button";

export function DeskNavUser({
  locale,
  callbackUrl,
}: {
  locale: string;
  callbackUrl?: string;
}) {
  const { data } = useSession();
  const t = useTranslations("Auth.Desk");
  const name = data?.user?.name ?? t("staff");
  const email = data?.user?.email ?? "";
  const signOutUrl = callbackUrl ?? `/${locale}/dashboard/signin`;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex w-full min-w-0 flex-col gap-2 p-1 group-data-[collapsible=icon]:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
              {name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {name}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                {email}
              </p>
            </div>
          </div>
          <LogoutButton
            callbackUrl={signOutUrl}
            variant="ghost"
            className="h-11 w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden"
          />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
