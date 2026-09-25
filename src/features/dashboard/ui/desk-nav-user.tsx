"use client";

import { useState } from "react";
import { EllipsisVertical, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

import {
  Avatar,
  AvatarFallback,
} from "@/shared/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/ui/sidebar";

export function DeskNavUser({
  locale,
  callbackUrl,
}: {
  locale: string;
  callbackUrl?: string;
}) {
  const { data, status } = useSession();
  const { isMobile } = useSidebar();
  const t = useTranslations("Auth.Desk");
  const [signingOut, setSigningOut] = useState(false);

  const ready = status !== "loading";
  const name = ready ? (data?.user?.name ?? t("staff")) : t("loading");
  const email = ready ? (data?.user?.email ?? "") : "";
  const initials = ready ? name.slice(0, 1).toUpperCase() : "…";
  const signOutUrl = callbackUrl ?? `/${locale}/dashboard/signin`;

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut({ callbackUrl: signOutUrl });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg grayscale">
                <AvatarFallback className="rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium text-sidebar-foreground">
                  {name}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {email}
                </span>
              </div>
              <EllipsisVertical className="ms-auto text-sidebar-foreground/70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                disabled={signingOut}
                onSelect={(event) => {
                  event.preventDefault();
                  void handleSignOut();
                }}
              >
                <LogOut />
                {signingOut ? t("signing_out") : t("log_out")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
