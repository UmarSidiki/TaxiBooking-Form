"use client";

import { Settings2 } from "lucide-react";
import type { useTranslations } from "next-intl";

export function FormBuilderEmptyProperties({
  t,
}: {
  t: ReturnType<typeof useTranslations<"FormBuilder">>;
}) {
  return (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="rounded-full bg-muted p-4 mb-3">
                            <Settings2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">{t("ui.select_field_to_configure")}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">Click an element on the canvas</p>
                        </div>
  );
}
