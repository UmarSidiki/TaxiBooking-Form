"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export function SignedInBanner() {
  const t = useTranslations("Riviera");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/me", { cache: "no-store", credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && typeof data?.email === "string") setEmail(data.email);
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
        <span>{t("signedInAs")}</span>
        <b dir="ltr" title={email}>{email}</b>
      </p>
      <span className="signed-in__actions">
        <Link href={`/${locale}/account`} className="signed-in__action">
          {t("switchAccount")}
        </Link>
        <button
          type="button"
          className="signed-in__action"
          onClick={signOut}
          disabled={signingOut}
        >
          {t("signOut")}
        </button>
      </span>
    </div>
  );
}
