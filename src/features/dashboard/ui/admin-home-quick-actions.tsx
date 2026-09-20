"use client";

import { Card, CardContent } from "@/shared/ui/card";
import { Calendar, Car, Settings, Users } from "lucide-react";
import type { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeQuickActions({ t }: { t: TFn }) {
  const router = useRouter();
  return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t("Dashboard.Home.quick-actions")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => router.push("/dashboard/rides")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">
                {t("Dashboard.Home.view-all-bookings")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("Dashboard.Home.manage-all-rides")}
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => router.push("/dashboard/fleet")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Car className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900">
                {t("Dashboard.Home.manage-fleet")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("Dashboard.Home.vehicle-management")}
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => router.push("/dashboard/partners")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900">
                {t("Dashboard.Home.view-partners")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("Dashboard.Home.partner-management")}
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => router.push("/dashboard/settings")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
                <Settings className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="font-medium text-gray-900">
                {t("Dashboard.Home.settings")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("Dashboard.Home.configure-system")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
