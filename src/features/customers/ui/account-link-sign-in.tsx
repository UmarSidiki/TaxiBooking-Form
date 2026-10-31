"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";

export function AccountLinkSignIn() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const hash = window.location.hash;
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );

    const token = new URLSearchParams(hash.replace(/^#/, "")).get("t") ?? "";
    const finish = (ok: boolean) =>
      window.location.replace(`/${locale}/account${ok ? "" : "?link=expired"}`);

    if (!token) {
      finish(false);
      return;
    }

    fetch("/api/account/link", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((response) => response.ok)
      .catch(() => false)
      .then(finish);
  }, [locale]);

  return (
    <div
      data-surface="desk"
      className="flex min-h-svh items-center justify-center bg-background p-4 text-foreground"
    >
      <p
        role="status"
        aria-live="polite"
        className="rounded-lg border border-border bg-card px-6 py-4 text-sm text-muted-foreground"
      >
        {t("signing-in")}
      </p>
    </div>
  );
}
