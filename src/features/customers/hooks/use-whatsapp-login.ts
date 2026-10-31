"use client";

import { useState } from "react";
import { type useTranslations } from "next-intl";

import { compactOtp } from "../lib/otp-entry";

type T = ReturnType<typeof useTranslations>;
type Mode = "closed" | "phone" | "code";

export type WhatsAppLogin = ReturnType<typeof useWhatsAppLogin>;

/** Sign-in by a verified WhatsApp number. Never learns or sends an email. */
export function useWhatsAppLogin({
  t,
  onSignedIn,
}: {
  t: T;
  onSignedIn: () => Promise<boolean>;
}) {
  const [mode, setMode] = useState<Mode>("closed");
  const [phone, setPhoneValue] = useState("");
  const [callingCode, setCallingCodeValue] = useState("");
  const [code, setCode] = useState("");
  const [notVerified, setNotVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setPhoneValue("");
    setCallingCodeValue("");
    setCode("");
    setNotVerified(false);
    setError(null);
    setNotice(null);
  };

  const open = () => {
    reset();
    setMode("phone");
  };

  const backToEmail = () => {
    reset();
    setMode("closed");
  };

  const setPhone = (value: string) => {
    setPhoneValue(value);
    setNotVerified(false);
    setError(null);
  };

  const setCallingCode = (value: string) => {
    setCallingCodeValue(value);
    setNotVerified(false);
    setError(null);
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    setNotVerified(false);
    setNotice(null);
    try {
      const response = await fetch("/api/account/otp/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          ...(callingCode.trim() ? { callingCode: callingCode.trim() } : {}),
        }),
      });
      const data = await response.json().catch(() => null);
      if (data?.code === "whatsapp_not_verified") {
        setNotVerified(true);
        return;
      }
      if (!response.ok) {
        setError(t("whatsapp-send-failed"));
        return;
      }
      setCode("");
      setNotice(t("code-sent"));
      setMode("code");
    } catch {
      setError(t("whatsapp-send-failed"));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/account/otp/whatsapp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code: compactOtp(code),
          ...(callingCode.trim() ? { callingCode: callingCode.trim() } : {}),
        }),
      });
      if (!response.ok) {
        setError(t("code-invalid"));
        return;
      }
      if (!(await onSignedIn())) {
        setError(t("code-invalid"));
        return;
      }
      backToEmail();
    } catch {
      setError(t("code-invalid"));
    } finally {
      setBusy(false);
    }
  };

  let fullDigits = phone.replace(/\D/g, "");
  const prefix = callingCode.replace(/\D/g, "");
  if (fullDigits.startsWith("00")) fullDigits = fullDigits.slice(2);
  if (prefix && fullDigits.startsWith("0")) {
    fullDigits = prefix + fullDigits.slice(1);
  } else if (prefix && !fullDigits.startsWith(prefix)) {
    fullDigits = prefix + fullDigits;
  }
  const phoneDisplay = fullDigits ? `+${fullDigits}` : "";

  return {
    mode,
    phone,
    callingCode,
    phoneDisplay,
    code,
    setCode,
    setPhone,
    setCallingCode,
    notVerified,
    error,
    notice,
    busy,
    open,
    backToEmail,
    send,
    verify,
  };
}
