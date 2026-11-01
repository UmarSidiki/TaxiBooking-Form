"use client";

import { useEffect, useState } from "react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { AccountT, CustomerProfile } from "./account-types";
import { AccountPhone } from "./account-phone";
import { AccountButton } from "./account-buttons";
import { AccountCard, AccountPageHeader } from "./account-page-header";

const LANGUAGES: Array<{ code: string; label: string }> = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "nl", label: "Nederlands" },
  { code: "it", label: "Italiano" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "العربية" },
];

async function patchProfile(body: Record<string, unknown>) {
  const res = await fetch("/api/account/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.profile ?? null) as CustomerProfile | null;
}

export function AccountProfile({
  t,
  email,
  profile,
  onSaved,
}: {
  t: AccountT;
  email: string;
  locale: string;
  profile: CustomerProfile | null;
  onSaved: (p: CustomerProfile) => void;
}) {
  const [name, setName] = useState(profile?.name ?? "");
  const [language, setLanguage] = useState(profile?.language ?? "en");
  const [home, setHome] = useState(profile?.savedAddresses?.home ?? "");
  const [work, setWork] = useState(profile?.savedAddresses?.work ?? "");
  const [airport, setAirport] = useState(profile?.savedAddresses?.airport ?? "");
  const [saving, setSaving] = useState<"details" | "places" | null>(null);
  const [notice, setNotice] = useState<{ form: "details" | "places"; text: string } | null>(null);

  useEffect(() => {
    setName(profile?.name ?? "");
    setLanguage(profile?.language ?? "en");
    setHome(profile?.savedAddresses?.home ?? "");
    setWork(profile?.savedAddresses?.work ?? "");
    setAirport(profile?.savedAddresses?.airport ?? "");
  }, [profile]);

  const save = async (form: "details" | "places") => {
    setSaving(form);
    setNotice(null);
    try {
      const saved = await patchProfile(
        form === "details" ? { name, language } : { savedAddresses: { home, work, airport } },
      );
      if (saved) {
        onSaved(saved);
        setNotice({ form, text: t("saved") });
      } else {
        setNotice({ form, text: t("save-failed") });
      }
    } finally {
      setSaving(null);
    }
  };

  const status = (form: "details" | "places") =>
    notice?.form === form ? (
      <p role="status" className="text-xs text-[var(--ink2)]">
        {notice.text}
      </p>
    ) : null;

  return (
    <>
      <AccountPageHeader title={t("profile")} subtitle={t("profile-subtitle")} />
      <div className="grid gap-4">
        <AccountCard id="details" title={t("personal-details")} description={t("personal-details-copy")}>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void save("details");
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="profile-name">{t("name")}</Label>
              <Input
                id="profile-name"
                autoComplete="name"
                className="h-11 text-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="profile-email">{t("email")}</Label>
              <Input
                id="profile-email"
                className="h-11 bg-[var(--well)] text-base"
                value={email}
                readOnly
                aria-describedby="profile-email-hint"
                dir="ltr"
              />
              <p id="profile-email-hint" className="text-[11px] leading-[1.5] text-[var(--ink2)]">
                {t("email-primary-hint")}
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="profile-language">{t("language")}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="profile-language" aria-label={t("language")} className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <AccountButton type="submit" variant="primary" disabled={saving !== null}>
                {saving === "details" ? `${t("saving")}…` : t("save-changes")}
              </AccountButton>
              {status("details")}
            </div>
          </form>
        </AccountCard>

        <AccountCard id="phone" title={t("whatsapp")} description={t("whatsapp-card-copy")}>
          <AccountPhone
            t={t}
            phone={profile?.verifiedPhone ?? ""}
            onSaved={(verifiedPhone) => onSaved({ ...(profile ?? {}), verifiedPhone })}
          />
        </AccountCard>

        <AccountCard id="places" title={t("saved-places")} description={t("saved-places-copy")}>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void save("places");
            }}
          >
            {(
              [
                ["addr-home", home, setHome],
                ["addr-work", work, setWork],
                ["addr-airport", airport, setAirport],
              ] as const
            ).map(([key, value, set]) => (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={key}>{t(key)}</Label>
                <Input
                  id={key}
                  className="h-11 text-base"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                />
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <AccountButton type="submit" variant="primary" disabled={saving !== null}>
                {saving === "places" ? `${t("saving")}…` : t("save-places")}
              </AccountButton>
              {status("places")}
            </div>
          </form>
        </AccountCard>
      </div>
    </>
  );
}
