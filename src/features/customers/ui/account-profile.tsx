"use client";

import { useEffect, useState } from "react";
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
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [whatsappOptIn, setWhatsappOptIn] = useState(profile?.whatsappOptIn ?? false);
  const [home, setHome] = useState(profile?.savedAddresses?.home ?? "");
  const [work, setWork] = useState(profile?.savedAddresses?.work ?? "");
  const [airport, setAirport] = useState(profile?.savedAddresses?.airport ?? "");
  const [language, setLanguage] = useState(profile?.language ?? "en");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? "");
    setPhone(profile?.phone ?? "");
    setWhatsappOptIn(profile?.whatsappOptIn ?? false);
    setHome(profile?.savedAddresses?.home ?? "");
    setWork(profile?.savedAddresses?.work ?? "");
    setAirport(profile?.savedAddresses?.airport ?? "");
    setLanguage(profile?.language ?? "en");
  }, [profile]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          whatsappOptIn,
          savedAddresses: { home, work, airport },
          language,
        }),
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
      <div>
        <Label htmlFor="profile-phone">{t("phone")}</Label>
        <Input id="profile-phone" className="h-11 text-base" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={whatsappOptIn} onCheckedChange={setWhatsappOptIn} />
        {t("whatsapp-opt-in")}
      </label>
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
        <Label>{t("language")}</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="h-11">
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