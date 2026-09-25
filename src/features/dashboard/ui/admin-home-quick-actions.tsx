"use client";

import { Link } from "@/shared/i18n/navigation";
import { Calendar, Car, Settings, Users } from "lucide-react";
import type { useTranslations } from "next-intl";

import { useSettingsDesk } from "@/features/settings/ui/settings-desk-context";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeQuickActions({ t }: { t: TFn }) {
  const { settings } = useSettingsDesk();
  const partnersOn = settings.enablePartners ?? false;

  const actions = [
    {
      href: "/dashboard/rides",
      icon: Calendar,
      title: t("Dashboard.Home.view-all-bookings"),
    },
    {
      href: "/dashboard/fleet",
      icon: Car,
      title: t("Dashboard.Home.manage-fleet"),
    },
    partnersOn
      ? {
          href: "/dashboard/partners",
          icon: Users,
          title: t("Dashboard.Home.view-partners"),
        }
      : null,
    {
      href: "/dashboard/settings",
      icon: Settings,
      title: t("Dashboard.Home.settings"),
    },
  ].filter(Boolean) as {
    href: string;
    icon: typeof Calendar;
    title: string;
  }[];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/60 bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <action.icon className="size-4 text-primary" aria-hidden="true" />
          {action.title}
        </Link>
      ))}
    </div>
  );
}
