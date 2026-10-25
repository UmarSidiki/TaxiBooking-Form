"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type Ride = {
  _id: string;
  tripId: string;
  pickup: string;
  dropoff?: string;
  date: string;
  time: string;
  status?: string;
  totalAmount?: number;
};

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

  const load = async (token?: string | null) => {
    const response = await fetch(token ? `/api/account/trips?token=${encodeURIComponent(token)}` : "/api/account/trips");
    if (!response.ok) return false;
    const data = await response.json();
    setUpcoming(data.upcoming ?? []);
    setPast(data.past ?? []);
    setPhase("trips");
    return true;
  };

  useEffect(() => {
    const token = params.get("token");
    void load(token);
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

  const act = async (tripId: string, action: "cancel" | "change") => {
    const response = await fetch(`/api/account/trips/${tripId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, date: action === "change" ? "2026-12-30" : undefined, time: action === "change" ? "11:00" : undefined }),
    });
    setNotice(response.ok ? t("updated") : t("cutoff"));
    if (response.ok) await load();
  };

  if (phase === "trips") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        {notice ? <p role="status">{notice}</p> : null}
        <section>
          <h2 className="font-semibold">{t("upcoming")}</h2>
          {upcoming.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty-upcoming")}</p> : upcoming.map((ride) => (
            <article key={ride.tripId} className="mt-3 rounded-md border border-border p-4">
              <p className="font-medium">{ride.pickup} → {ride.dropoff || t("hourly")}</p>
              <p className="text-sm">{ride.date} {ride.time}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button className="h-11" type="button" onClick={() => void act(ride.tripId, "change")}>{t("change")}</Button>
                <Button className="h-11" type="button" variant="destructive" onClick={() => void act(ride.tripId, "cancel")}>{t("cancel")}</Button>
                <a className="inline-flex h-11 items-center rounded-md border border-border px-4" href={`/api/invoice/${ride.tripId}`}>{t("invoice")}</a>
                <a className="inline-flex h-11 items-center rounded-md border border-border px-4" href={`/${locale}?pickup=${encodeURIComponent(ride.pickup)}&dropoff=${encodeURIComponent(ride.dropoff || "")}`}>{t("rebook")}</a>
              </div>
            </article>
          ))}
        </section>
        <section>
          <h2 className="font-semibold">{t("past")}</h2>
          {past.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty-past")}</p> : past.map((ride) => (
            <p key={ride.tripId} className="mt-2 text-sm">{ride.date} {ride.pickup} ({ride.status})</p>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{t("sign-in")}</h1>
      <p className="text-sm text-muted-foreground">{t("sign-in-help")}</p>
      {error ? <p role="alert">{error}</p> : null}
      {notice ? <p role="status">{notice}</p> : null}
      <label className="text-sm" htmlFor="account-email">{t("email")}</label>
      <Input id="account-email" className="h-11" value={email} onChange={(event) => setEmail(event.target.value)} />
      <label className="text-sm" htmlFor="account-phone">{t("phone")}</label>
      <Input id="account-phone" className="h-11" value={phone} onChange={(event) => setPhone(event.target.value)} />
      {phase === "code" ? (
        <>
          <label className="text-sm" htmlFor="account-code">{t("code")}</label>
          <Input id="account-code" className="h-11" value={code} onChange={(event) => setCode(event.target.value)} />
          <Button className="h-11" type="button" onClick={() => void verify()}>{t("verify")}</Button>
        </>
      ) : (
        <Button className="h-11" type="button" onClick={() => void send()}>{t("send-code")}</Button>
      )}
    </div>
  );
}
