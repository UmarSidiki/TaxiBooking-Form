"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AdminHomeHeader } from "@/components/admin-home/admin-home-header";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeLoading({ t }: { t: TFn }) {
  return (
      <div className="space-y-6">
        <AdminHomeHeader t={t}>
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </AdminHomeHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="h-10 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
  );
}
