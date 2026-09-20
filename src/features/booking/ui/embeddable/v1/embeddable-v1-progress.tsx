"use client";

import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

const iconMap = {
  MapPin,
  Car,
  CheckCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Users,
  Calendar,
  AlertCircle,
};

export function EmbeddableV1Progress({ t }: { t: TFn }) {
  const progressSteps = [
    { icon: "MapPin", label: t("embeddable.trip") },
    { icon: "Car", label: t("embeddable.vehicle") },
    { icon: "CheckCircle", label: t("embeddable.payment") },
  ];

  return (
        <div className="flex justify-between items-center px-3 py-2">
          {progressSteps.map(({ icon: iconName, label }, index) => {
            const Icon = iconMap[iconName as keyof typeof iconMap];
            return (
              <div
                key={index}
                className="flex flex-1 flex-col items-center relative"
              >
                {index < progressSteps.length - 1 && (
                  <div className="absolute top-3 left-1/2 w-full h-0.5 bg-slate-200 -z-10 md:top-4" />
                )}
                <div
                  className={`flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    index === 0
                      ? "border-primary bg-primary text-white shadow-md"
                      : "border-slate-300 bg-white text-slate-400"
                  }`}
                >
                  <Icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                </div>
                <span
                  className={`mt-1 text-xs font-medium ${
                    index === 0 ? "text-primary font-bold" : "text-neutral-600"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
  );
}
