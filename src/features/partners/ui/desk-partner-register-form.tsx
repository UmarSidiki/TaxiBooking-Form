"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";

import { Button } from "@/shared/ui/button";
import { DeskAuthBrand } from "@/features/auth/ui/desk-auth-brand";
import { DeskAuthCover } from "@/features/auth/ui/desk-auth-cover";
import { DeskAuthShell } from "@/features/auth/ui/desk-auth-shell";
import {
  DeskPartnerRegisterFields,
  type PartnerRegisterValues,
} from "@/features/partners/ui/desk-partner-register-fields";

const empty: PartnerRegisterValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  address: "",
  city: "",
  country: "",
};

export function DeskPartnerRegisterForm() {
  const router = useRouter();
  const t = useTranslations("Auth.PartnerRegister");
  const [values, setValues] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (values.password !== values.confirmPassword) {
      setError(t("mismatch"));
      return;
    }
    if (values.password.length < 8) {
      setError(t("too_short"));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/partners/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          phone: values.phone,
          address: values.address,
          city: values.city,
          country: values.country,
        }),
      });
      if (!response.ok) {
        setError(t("failed"));
        return;
      }
      setSuccess(true);
    } catch {
      setError(t("failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DeskAuthShell
      cover={
        <DeskAuthCover kicker={t("cover_kicker")} title={t("cover_title")} body={t("cover_body")} />
      }
    >
      <DeskAuthBrand />
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md py-6">
          {success ? (
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {t("success_title")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("success_body")}</p>
              <Button className="mt-8 h-11 w-full" onClick={() => router.push("/partners/login")}>
                {t("go_login")}
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {t("title")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <DeskPartnerRegisterFields
                  values={values}
                  loading={loading}
                  showPassword={showPassword}
                  showConfirm={showConfirm}
                  onChange={onChange}
                  onTogglePassword={() => setShowPassword((open) => !open)}
                  onToggleConfirm={() => setShowConfirm((open) => !open)}
                />
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
                <Button type="submit" disabled={loading} className="h-11 w-full">
                  {loading ? t("submitting") : t("submit")}
                </Button>
              </form>
              <Link
                href="/partners/login"
                className="mt-6 inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
              >
                {t("sign_in")}
              </Link>
            </>
          )}
        </div>
      </div>
    </DeskAuthShell>
  );
}
