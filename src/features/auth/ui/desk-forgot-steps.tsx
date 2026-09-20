"use client";

import type { FormEvent } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type Step = "email" | "otp" | "password";

type DeskForgotStepsProps = {
  step: Step;
  email: string;
  setEmail: (value: string) => void;
  otp: string;
  setOtp: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  error: string | null;
  success: string | null;
  loading: boolean;
  onEmail: (event: FormEvent<HTMLFormElement>) => void;
  onOtp: (event: FormEvent<HTMLFormElement>) => void;
  onPassword: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
};

export function DeskForgotSteps(props: DeskForgotStepsProps) {
  const t = useTranslations("Auth.Forgot");
  const titles = {
    email: t("title_email"),
    otp: t("title_otp"),
    password: t("title_password"),
  };
  const subtitles = {
    email: t("subtitle_email"),
    otp: t("subtitle_otp"),
    password: t("subtitle_password"),
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {titles[props.step]}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitles[props.step]}</p>
      {props.step === "email" ? <EmailStep {...props} t={t} /> : null}
      {props.step === "otp" ? <OtpStep {...props} t={t} /> : null}
      {props.step === "password" ? <PasswordStep {...props} t={t} /> : null}
    </>
  );
}

function Messages({
  error,
  success,
}: {
  error: string | null;
  success: string | null;
}) {
  return (
    <>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-foreground" role="status">
          {success}
        </p>
      ) : null}
    </>
  );
}

function EmailStep({
  email,
  setEmail,
  loading,
  error,
  success,
  onEmail,
  t,
}: DeskForgotStepsProps & { t: ReturnType<typeof useTranslations> }) {
  return (
    <form className="mt-8 space-y-5" onSubmit={onEmail}>
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={loading}
          className="h-11"
        />
      </div>
      <Messages error={error} success={success} />
      <Button type="submit" disabled={loading} className="h-11 w-full">
        {loading ? t("sending") : t("send")}
      </Button>
    </form>
  );
}

function OtpStep({
  otp,
  setOtp,
  loading,
  error,
  success,
  onOtp,
  onBack,
  t,
}: DeskForgotStepsProps & { t: ReturnType<typeof useTranslations> }) {
  return (
    <form className="mt-8 space-y-5" onSubmit={onOtp}>
      <div className="space-y-2">
        <Label htmlFor="otp">{t("otp")}</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={otp}
          onChange={(event) => setOtp(event.target.value)}
          required
          disabled={loading}
          maxLength={6}
          className="h-11 text-center tracking-[0.4em]"
        />
      </div>
      <Messages error={error} success={success} />
      <Button type="submit" disabled={loading} className="h-11 w-full">
        {loading ? t("verifying") : t("verify")}
      </Button>
      <Button type="button" variant="ghost" onClick={onBack} className="h-11 w-full">
        {t("back_email")}
      </Button>
    </form>
  );
}

function PasswordStep({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  error,
  success,
  onPassword,
  t,
}: DeskForgotStepsProps & { t: ReturnType<typeof useTranslations> }) {
  return (
    <form className="mt-8 space-y-5" onSubmit={onPassword}>
      <div className="space-y-2">
        <Label htmlFor="newPassword">{t("new_password")}</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          disabled={loading}
          minLength={8}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("confirm_password")}</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          disabled={loading}
          minLength={8}
          className="h-11"
        />
      </div>
      <Messages error={error} success={success} />
      <Button type="submit" disabled={loading} className="h-11 w-full">
        {loading ? t("resetting") : t("reset")}
      </Button>
    </form>
  );
}
