"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LogOut, RefreshCw, UserRound } from "lucide-react";

import { displayName } from "@/features/customers/ui/account-format";

export function SignedInBanner() {
  const t = useTranslations("Riviera");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/me", { cache: "no-store", credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (typeof data?.email === "string") setEmail(data.email);
        if (typeof data?.name === "string") setName(data.name);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!email) return null;

  const signOut = async () => {
    setSigningOut(true);
    await fetch("/api/account/logout", {
      method: "POST",
      credentials: "same-origin",
    }).catch(() => null);
    window.location.reload();
  };

  return (
    <div className="signed-in">
      <p className="signed-in__who">
        <span className="signed-in__avatar" aria-hidden="true">
          <UserRound className="size-4" />
        </span>
        <span className="signed-in__name" title={email}>
          {displayName(name, email)}
        </span>
        <span className="signed-in__email" dir="ltr" title={email}>
          {email}
        </span>
      </p>
      <span className="signed-in__actions">
        <Link href={`/${locale}/account`} className="signed-in__action">
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {t("switchAccount")}
        </Link>
        <button
          type="button"
          className="signed-in__action"
          onClick={signOut}
          disabled={signingOut}
        >
          <LogOut className="size-3.5" aria-hidden="true" />
          {t("signOut")}
        </button>
      </span>
    </div>
  );
}
