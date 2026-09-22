"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/shared/i18n/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { DeskAuthBrand } from "@/features/auth/ui/desk-auth-brand";
import { DeskAuthCover } from "@/features/auth/ui/desk-auth-cover";
import { DeskAuthShell } from "@/features/auth/ui/desk-auth-shell";
import { DeskForgotSteps } from "@/features/auth/ui/desk-forgot-steps";

type Step = "email" | "otp" | "password";

export function DeskForgotPasswordForm() {
  const router = useRouter();
  const t = useTranslations("Auth.Forgot");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleRequestOTP = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        setError(t("send_failed"));
        return;
      }
      setSuccess(t("otp_sent"));
      setStep("otp");
    } catch {
      setError(t("send_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      if (!response.ok) {
        setError(t("otp_invalid"));
        return;
      }
      setSuccess(t("otp_verified"));
      setStep("password");
    } catch {
      setError(t("otp_invalid"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    if (newPassword !== confirmPassword) {
      setError(t("mismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("too_short"));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      if (!response.ok) {
        setError(t("reset_failed"));
        return;
      }
      setSuccess(t("reset_ok"));
      setTimeout(() => {
        router.push("/dashboard/signin");
      }, 1600);
    } catch {
      setError(t("reset_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DeskAuthShell cover={<DeskAuthCover />}>
      <DeskAuthBrand />
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-xs">
          <DeskForgotSteps
            step={step}
            email={email}
            setEmail={setEmail}
            otp={otp}
            setOtp={setOtp}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            error={error}
            success={success}
            loading={loading}
            onEmail={handleRequestOTP}
            onOtp={handleVerifyOTP}
            onPassword={handleResetPassword}
            onBack={() => setStep("email")}
          />
          <Link
            href="/dashboard/signin"
            className="mt-4 inline-flex min-h-11 items-center rounded-sm text-sm text-primary underline-offset-4 transition-colors duration-200 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {t("back")}
          </Link>
        </div>
      </div>
    </DeskAuthShell>
  );
}
