"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { DeskAuthBrand } from "@/features/auth/ui/desk-auth-brand";
import { DeskAuthCover } from "@/features/auth/ui/desk-auth-cover";
import { DeskAuthShell } from "@/features/auth/ui/desk-auth-shell";

export function DeskCredentialsForm({
  callbackUrl,
  title,
  subtitle,
  cover,
  footer,
  formWidthClass = "max-w-xs",
}: {
  callbackUrl: string;
  title: string;
  subtitle: string;
  cover: { kicker: string; title: string; body: string };
  footer?: ReactNode;
  formWidthClass?: string;
}) {
  const router = useRouter();
  const t = useTranslations("Auth.SignIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError(t("invalid"));
      emailRef.current?.focus();
      return;
    }

    router.push(result?.url ?? callbackUrl);
  };

  return (
    <DeskAuthShell
      cover={
        <DeskAuthCover kicker={cover.kicker} title={cover.title} body={cover.body} />
      }
    >
      <DeskAuthBrand />
      <div className="flex flex-1 items-center justify-center">
        <div className={`w-full ${formWidthClass}`}>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-pretty text-sm text-muted-foreground">{subtitle}</p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                ref={emailRef}
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
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                  aria-invalid={error ? true : undefined}
                  className="h-11 pe-11"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 end-0 flex min-w-11 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
                  onClick={() => setShowPassword((open) => !open)}
                  disabled={loading}
                  aria-label={showPassword ? t("hide_password") : t("show_password")}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              <p
                className="min-h-5 text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full transition-colors duration-200 active:bg-primary/80"
            >
              {loading ? t("submitting") : t("submit")}
            </Button>
          </form>
          {footer}
        </div>
      </div>
    </DeskAuthShell>
  );
}
