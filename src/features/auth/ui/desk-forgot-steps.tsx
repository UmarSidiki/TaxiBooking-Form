"use client";

import type { FormEvent } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  deskSubmitClass,
  DeskForgotMessages,
} from "@/features/auth/ui/desk-forgot-messages";
import { DeskForgotPasswordStep } from "@/features/auth/ui/desk-forgot-password-step";

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
    <div key={props.step} className="desk-step-in">
      <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
        {titles[props.step]}
      </h1>
      <p className="mt-2 text-pretty text-sm text-muted-foreground">
        {subtitles[props.step]}
      </p>
      {props.step === "email" ? <EmailStep {...props} t={t} /> : null}
      {props.step === "otp" ? <OtpStep {...props} t={t} /> : null}
      {props.step === "password" ? (
        <DeskForgotPasswordStep {...props} t={t} />
      ) : null}
    </div>
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
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={loading}
          aria-invalid={error ? true : undefined}
          className="h-11"
        />
      </div>
      <DeskForgotMessages error={error} success={success} />
      <Button type="submit" disabled={loading} className={deskSubmitClass}>
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
          name="one-time-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          spellCheck={false}
          value={otp}
          onChange={(event) => setOtp(event.target.value)}
          required
          disabled={loading}
          maxLength={6}
          aria-invalid={error ? true : undefined}
          className="h-11 text-center tracking-[0.3em]"
        />
      </div>
      <DeskForgotMessages error={error} success={success} />
      <Button type="submit" disabled={loading} className={deskSubmitClass}>
        {loading ? t("verifying") : t("verify")}
      </Button>
      <Button type="button" variant="ghost" onClick={onBack} className="h-11 w-full">
        {t("back_email")}
      </Button>
    </form>
  );
}
