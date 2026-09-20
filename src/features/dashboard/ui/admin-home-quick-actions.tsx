"use client";

import { Link } from "@/shared/i18n/navigation";
import { useEffect, useState } from "react";
import { Calendar, Car, Settings, Users } from "lucide-react";
import type { useTranslations } from "next-intl";

import { Card, CardContent } from "@/shared/ui/card";
import type { ISetting } from "@/features/settings/model";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeQuickActions({ t }: { t: TFn }) {
  const [partnersOn, setPartnersOn] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        const data = await response.json();
        if (data.success) {
          const settings = data.data as Partial<ISetting>;
          setPartnersOn(settings.enablePartners ?? false);
        }
      } catch {
        setPartnersOn(false);
      }
    };
    load();
  }, []);

  const actions = [
    {
      href: "/dashboard/rides",
      icon: Calendar,
      title: t("Dashboard.Home.view-all-bookings"),
      hint: t("Dashboard.Home.manage-all-rides"),
    },
    {
      href: "/dashboard/fleet",
      icon: Car,
      title: t("Dashboard.Home.manage-fleet"),
      hint: t("Dashboard.Home.vehicle-management"),
    },
    partnersOn
      ? {
          href: "/dashboard/partners",
          icon: Users,
          title: t("Dashboard.Home.view-partners"),
          hint: t("Dashboard.Home.partner-management"),
        }
      : null,
    {
      href: "/dashboard/settings",
      icon: Settings,
      title: t("Dashboard.Home.settings"),
      hint: t("Dashboard.Home.configure-system"),
    },
  ].filter(Boolean) as {
    href: string;
    icon: typeof Calendar;
    title: string;
    hint: string;
  }[];

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">
        {t("Dashboard.Home.quick-actions")}
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className="block">
            <Card className="desk-card h-full border-border transition-shadow duration-200 hover:shadow-md">
              <CardContent className="p-5">
                <action.icon className="size-5 text-primary" />
                <h3 className="mt-4 font-medium text-foreground">{action.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{action.hint}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
