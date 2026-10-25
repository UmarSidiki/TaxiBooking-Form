"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";

export function PhoneRequiredNotice({ href }: { href: string }) {
  const t = useTranslations("Phone");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const path = href.includes("drivers") ? "/api/drivers/me" : "/api/partners/profile";
    void fetch(path)
      .then((response) => response.json())
      .then((body) => {
        const phone = body?.partner?.phone ?? body?.data?.phone ?? body?.driver?.phone;
        setMissing(!phone);
      })
      .catch(() => setMissing(false));
  }, [href]);

  if (!missing) return null;
  return (
    <p className="rounded-md border border-border bg-card px-4 py-3 text-sm" role="status">
      {t("missing")}{" "}
      <Link href={href} className="text-primary underline-offset-4 hover:underline">
        {t("add")}
      </Link>
    </p>
  );
}
