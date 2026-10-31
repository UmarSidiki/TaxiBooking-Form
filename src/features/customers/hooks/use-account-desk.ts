"use client";

import { useEffect, useReducer, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type {
  AccountRides,
  CustomerProfile,
} from "../ui/account-types";
import type { GreetingKey } from "../lib/account-greeting";
import { greetingKeyInTimeZone } from "../lib/account-greeting";
import { setPortalMoneyFormat } from "../ui/portal-money";
import {
  accountLoginFeedbackReducer,
  initialAccountLoginFeedback,
} from "../lib/account-login-feedback";
import { compactOtp } from "../lib/otp-entry";
import { useWhatsAppLogin } from "./use-whatsapp-login";

export const EMPTY_ACCOUNT_RIDES: AccountRides = {
  upcoming: [],
  past: [],
  canceled: [],
};

export function useAccountDesk({
  expiredLink,
  initialEmail,
  prefilledEmail,
  initialRides,
  initialProfile,
  initialGreeting,
  currency,
  timezone,
}: {
  expiredLink: boolean;
  initialEmail: string;
  prefilledEmail: string;
  initialRides: AccountRides;
  initialProfile: CustomerProfile | null;
  initialGreeting: GreetingKey;
  currency: string;
  timezone: string;
}) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const [email, setEmail] = useState(initialEmail || prefilledEmail);
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"login" | "code" | "trips">(
    initialEmail ? "trips" : "login",
  );
  const [feedback, dispatchFeedback] = useReducer(
    accountLoginFeedbackReducer,
    initialAccountLoginFeedback,
  );
  const [rides, setRides] = useState<AccountRides>(initialRides);
  const [profile, setProfile] = useState<CustomerProfile | null>(initialProfile);
  const [greeting, setGreeting] = useState<GreetingKey>(initialGreeting);

  useEffect(() => {
    setPortalMoneyFormat({ currency, locale });
    if (!expiredLink) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("token");
    url.searchParams.delete("link");
    window.history.replaceState(null, "", url.toString());
  }, [currency, locale, expiredLink]);

  const refresh = async () => {
    const response = await fetch("/api/account/trips");
    if (!response.ok) return false;
    const data = await response.json();
    setRides({
      upcoming: data.upcoming ?? [],
      past: data.past ?? [],
      canceled: data.canceled ?? [],
    });
    if (data.email) setEmail((previous) => previous || data.email);
    return true;
  };

  const loadProfile = async () => {
    const response = await fetch("/api/account/profile");
    if (!response.ok) return;
    const data = await response.json();
    setProfile(data?.profile ?? null);
  };

  const completeSignIn = async () => {
    dispatchFeedback({ type: "signed-in" });
    if (!(await refresh())) {
      dispatchFeedback({ type: "verify-failed", error: t("code-invalid") });
      return false;
    }
    await loadProfile();
    setGreeting(greetingKeyInTimeZone(new Date(), timezone));
    setPhase("trips");
    return true;
  };

  const whatsapp = useWhatsAppLogin({ t, onSignedIn: completeSignIn });

  const send = async () => {
    dispatchFeedback({ type: "send-started" });
    const response = await fetch("/api/account/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      dispatchFeedback({ type: "send-failed", error: t("send-failed") });
      return;
    }
    if (data?.code === "no_booking") {
      dispatchFeedback({ type: "send-no-booking" });
      return;
    }
    dispatchFeedback({ type: "send-succeeded", notice: t("code-sent") });
    setPhase("code");
  };

  const verify = async () => {
    const response = await fetch("/api/account/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: compactOtp(code) }),
    });
    if (!response.ok) {
      dispatchFeedback({ type: "verify-failed", error: t("code-invalid") });
      return;
    }
    await completeSignIn();
  };

  const editEmail = (value: string) => {
    setEmail(value);
    dispatchFeedback({ type: "email-edited" });
  };

  const useDifferentEmail = () => {
    setEmail("");
    setCode("");
    setPhase("login");
    dispatchFeedback({ type: "use-different-email" });
  };

  const resetToLogin = () => {
    setPhase("login");
    setEmail("");
    setCode("");
    setRides(EMPTY_ACCOUNT_RIDES);
    setProfile(null);
    dispatchFeedback({ type: "reset" });
  };

  const logout = async () => {
    await fetch("/api/account/logout", { method: "POST" }).catch(() => null);
    resetToLogin();
  };

  const signOutEverywhere = async () => {
    await fetch("/api/account/sessions/revoke-all", {
      method: "POST",
    }).catch(() => null);
    resetToLogin();
  };

  return {
    t,
    locale,
    email,
    setEmail,
    code,
    setCode,
    phase,
    feedback,
    rides,
    profile,
    setProfile,
    greeting,
    whatsapp,
    refresh,
    send,
    verify,
    editEmail,
    useDifferentEmail,
    logout,
    signOutEverywhere,
  };
}
