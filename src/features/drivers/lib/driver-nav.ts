import { Calendar, User } from "lucide-react";

import type { DeskNavGroup } from "@/features/dashboard/lib/sidebar-nav";

export const driverNavGroups: DeskNavGroup[] = [
  {
    id: "assignments",
    labelKey: "Sidebar.my_assignments",
    items: [
      {
        titleKey: "Sidebar.my_assignments",
        href: (locale) => `/${locale}/drivers/dashboard`,
        icon: Calendar,
        showWhen: "approved",
      },
    ],
  },
  {
    id: "account",
    labelKey: "Sidebar.account",
    items: [
      {
        titleKey: "Driver.account",
        href: (locale) => `/${locale}/drivers/account`,
        icon: User,
      },
    ],
  },
];
