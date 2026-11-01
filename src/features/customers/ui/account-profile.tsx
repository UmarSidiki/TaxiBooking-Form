"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { CustomerProfile } from "./account-types";
import { AccountPhone } from "./account-phone";

const LOCALES = ["en", "fr", "es", "de", "nl", "it", "ru", "ar"];

export function AccountProfile({
  t,
  profile,
  onSaved,
}: {
  t: (k: string) => string;
  profile: CustomerProfile | null;
  onSaved: (p: CustomerProfile) => void;
}) {
  const marketingT = useTranslations("Marketing");
  const [name, setName] = useState(profile?.name ?? "");
  const [whatsappOptIn, setWhatsappOptIn] = useState(profile?.whatsappOptIn ?? false);
  const [marketingEmail, setMarketingEmail] = useState(
    profile?.marketing?.email?.status === "granted",
  );
  const [marketingWhatsapp, setMarketingWhatsapp] = useState(
    profile?.marketing?.whatsapp?.status === "granted",
  );
  const [home, setHome] = useState(profile?.savedAddresses?.home ?? "");
  const [work, setWork] = useState(profile?.savedAddresses?.work ?? "");
  const [airport, setAirport] = useState(profile?.savedAddresses?.airport ?? "");
  const [language, setLanguage] = useState(profile?.language ?? "en");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? "");
    setWhatsappOptIn(profile?.whatsappOptIn ?? false);
    setMarketingEmail(profile?.marketing?.email?.status === "granted");
    setMarketingWhatsapp(profile?.marketing?.whatsapp?.status === "granted");
    setHome(profile?.savedAddresses?.home ?? "");
    setWork(profile?.savedAddresses?.work ?? "");
    setAirport(profile?.savedAddresses?.airport ?? "");
    setLanguage(profile?.language ?? "en");
  }, [profile]);

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name,
        whatsappOptIn,
        savedAddresses: { home, work, airport },
        language,
      };
      // Only send toggles the customer actually changed, so opening and
      // saving the form never writes a consent event.
      const originalEmail = profile?.marketing?.email?.status === "granted";
      if (marketingEmail !== originalEmail) body.marketingEmailOptIn = marketingEmail;
      const originalWhatsapp = profile?.marketing?.whatsapp?.status === "granted";
      if (marketingWhatsapp !== originalWhatsapp) {
        body.marketingWhatsappOptIn = marketingWhatsapp;
      }

      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        onSaved(data.profile);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("profile")}</h2>
      <div>
        <Label htmlFor="profile-name">{t("name")}</Label>
        <Input id="profile-name" className="h-11 text-base" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div id="phone" className="scroll-mt-24">
        <AccountPhone t={t} phone={profile?.verifiedPhone ?? ""} onSaved={(verifiedPhone) => onSaved({ ...(profile ?? {}), verifiedPhone })} />
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <Switch checked={whatsappOptIn} onCheckedChange={setWhatsappOptIn} />
        {t("whatsapp-opt-in")}
      </label>
      <fieldset className="space-y-2 rounded-md border border-[var(--rule)] p-3">
        <legend className="px-1 text-sm font-medium">{marketingT("account-title")}</legend>
        <p className="text-xs text-muted-foreground">{marketingT("account-note")}</p>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <Switch checked={marketingEmail} onCheckedChange={setMarketingEmail} />
          {marketingT("account-email")}
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <Switch checked={marketingWhatsapp} onCheckedChange={setMarketingWhatsapp} />
          <span>
            {marketingT("account-whatsapp")}
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {marketingT("account-whatsapp-hint")}
            </span>
          </span>
        </label>
      </fieldset>
      <div>
        <Label htmlFor="addr-home">{t("addr-home")}</Label>
        <Input id="addr-home" className="h-11 text-base" value={home} onChange={(e) => setHome(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="addr-work">{t("addr-work")}</Label>
        <Input id="addr-work" className="h-11 text-base" value={work} onChange={(e) => setWork(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="addr-airport">{t("addr-airport")}</Label>
        <Input id="addr-airport" className="h-11 text-base" value={airport} onChange={(e) => setAirport(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="profile-language">{t("language")}</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger id="profile-language" aria-label={t("language")} className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCALES.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button className="h-11" type="button" onClick={save} disabled={saving}>
        {saving ? `${t("saving")}…` : t("save-profile")}
      </Button>
    </div>
  );
}