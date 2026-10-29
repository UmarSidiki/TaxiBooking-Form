"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AccountLogin } from "./account-login";
import { TripCard } from "./trip-card";
import { TripDetailDialog } from "./trip-detail-dialog";
import { ChangeTripDialog } from "./change-trip-dialog";
import { CancelTripDialog } from "./cancel-trip-dialog";
import { AccountProfile } from "./account-profile";
import type { Ride, CustomerProfile } from "./account-types";

export function AccountDesk() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"login" | "code" | "trips">("login");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<Ride[]>([]);
  const [past, setPast] = useState<Ride[]>([]);
  const [canceled, setCanceled] = useState<Ride[]>([]);
  const [tab, setTab] = useState("upcoming");
  const [selected, setSelected] = useState<Ride | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [changeResult, setChangeResult] = useState<{ totalAmount?: number; payUrl?: string; refundRequestId?: string } | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [customerName, setCustomerName] = useState("");

  const load = async (token?: string | null) => {
    const response = await fetch(token ? `/api/account/trips?token=${encodeURIComponent(token)}` : "/api/account/trips");
    if (!response.ok) return false;
    const data = await response.json();
    setUpcoming(data.upcoming ?? []);
    setPast(data.past ?? []);
    setCanceled(data.canceled ?? []);
    if (data.email) {
      setEmail(data.email);
      setCustomerName(data.email);
    }
    setPhase("trips");
    return true;
  };

  useEffect(() => {
    const token = params.get("token");
    void load(token);
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d?.data ?? null))
      .catch(() => null);
    fetch("/api/account/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.profile) setProfile(d.profile);
        if (d?.profile?.name) setCustomerName(d.profile.name);
      })
      .catch(() => null);
  }, [params]);

  const send = async () => {
    setError(null);
    const response = await fetch("/api/account/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone }),
    });
    if (!response.ok) {
      setError(t("send-failed"));
      return;
    }
    setNotice(t("code-sent"));
    setPhase("code");
  };

  const verify = async () => {
    const response = await fetch("/api/account/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    if (!response.ok) {
      setError(t("code-invalid"));
      return;
    }
    await load();
  };

  const openDetail = (ride: Ride) => {
    setSelected(ride);
    setDetailOpen(true);
  };

  const openChange = () => {
    setChangeResult(null);
    setChangeOpen(true);
    setDetailOpen(false);
  };

  const openCancel = () => {
    setCancelOpen(true);
    setDetailOpen(false);
  };

  const handleChange = async (data: { date: string; time: string; passengers: number; childSeats: number; babySeats: number; meetAndGreet: boolean }) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/account/trips/${selected.tripId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change", ...data }),
      });
      const body = await response.json().catch(() => null);
      if (response.ok && body?.ok) {
        setChangeResult({ totalAmount: body.totalAmount, payUrl: body.payUrl, refundRequestId: body.refundRequestId });
        setNotice(t("updated"));
        await load();
      } else {
        setNotice(t("cutoff"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/account/trips/${selected.tripId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (response.ok) {
        setNotice(t("updated"));
        setCancelOpen(false);
        setSelected(null);
        await load();
      } else {
        setNotice(t("cutoff"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const logout = () => {
    document.cookie = "customer_session=; Max-Age=0; path=/";
    setPhase("login");
    setUpcoming([]);
    setPast([]);
    setCanceled([]);
    setProfile(null);
    setCustomerName("");
    setEmail("");
  };

  if (phase !== "trips") {
    return (
      <AccountLogin
        t={t as any}
        email={email}
        setEmail={setEmail}
        phone={phone}
        setPhone={setPhone}
        code={code}
        setCode={setCode}
        phase={phase === "code" ? "code" : "login"}
        error={error}
        notice={notice}
        onSend={send}
        onVerify={verify}
      />
    );
  }

  const listForTab = tab === "upcoming" ? upcoming : tab === "past" ? past : canceled;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 pb-24">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          {customerName ? <p className="text-sm text-muted-foreground">{customerName}</p> : null}
        </div>
        <Button className="h-11" type="button" variant="outline" onClick={logout}>{t("logout")}</Button>
      </header>
      {notice ? <p role="status" className="text-sm">{notice}</p> : null}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-1">
          <TabsTrigger value="upcoming" className="h-11">{t("upcoming")}</TabsTrigger>
          <TabsTrigger value="past" className="h-11">{t("past")}</TabsTrigger>
          <TabsTrigger value="canceled" className="h-11">{t("cancelled")}</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-3">
          {listForTab.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {tab === "upcoming" ? t("empty-upcoming") : tab === "past" ? t("empty-past") : t("empty-canceled")}
            </p>
          ) : (
            listForTab.map((ride) => (
              <TripCard key={ride.tripId} ride={ride} t={t as any} onView={() => openDetail(ride)} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <section className="rounded-lg border border-border p-4">
        <AccountProfile t={t as any} profile={profile} onSaved={(p) => setProfile(p)} />
      </section>

      <TripDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        ride={selected}
        t={t as any}
        locale={locale}
        onChange={openChange}
        onCancel={openCancel}
        settings={settings}
      />

      <ChangeTripDialog
        open={changeOpen}
        onOpenChange={setChangeOpen}
        ride={selected}
        t={t as any}
        onSubmit={handleChange}
        submitting={submitting}
        result={changeResult}
      />

      <CancelTripDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        ride={selected}
        t={t as any}
        locale={locale}
        onConfirm={handleCancel}
        submitting={submitting}
      />
    </div>
  );
}