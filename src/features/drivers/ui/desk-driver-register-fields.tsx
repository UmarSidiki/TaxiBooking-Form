"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export type DriverRegisterValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
};

export function DeskDriverRegisterFields({
  values,
  loading,
  showPassword,
  showConfirm,
  onChange,
  onTogglePassword,
  onToggleConfirm,
}: {
  values: DriverRegisterValues;
  loading: boolean;
  showPassword: boolean;
  showConfirm: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onToggleConfirm: () => void;
}) {
  const t = useTranslations("Auth.DriverRegister");

  return (
    <div className="space-y-4">
      <Field
        id="name"
        label={t("name")}
        type="text"
        value={values.name}
        onChange={onChange}
        loading={loading}
      />
      <Field
        id="email"
        label={t("email")}
        type="email"
        value={values.email}
        onChange={onChange}
        loading={loading}
        autoComplete="email"
      />
      <Field
        id="phone"
        label={t("phone")}
        type="tel"
        value={values.phone}
        onChange={onChange}
        loading={loading}
        autoComplete="tel"
      />
      <PasswordField
        id="password"
        label={t("password")}
        value={values.password}
        show={showPassword}
        onToggle={onTogglePassword}
        onChange={onChange}
        loading={loading}
        hideLabel={t("hide_password")}
        showLabel={t("show_password")}
        autoComplete="new-password"
      />
      <PasswordField
        id="confirmPassword"
        label={t("confirm_password")}
        value={values.confirmPassword}
        show={showConfirm}
        onToggle={onToggleConfirm}
        onChange={onChange}
        loading={loading}
        hideLabel={t("hide_password")}
        showLabel={t("show_password")}
        autoComplete="new-password"
      />
    </div>
  );
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  loading,
  autoComplete,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        required
        disabled={loading}
        autoComplete={autoComplete}
        className="h-11"
      />
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  show,
  onToggle,
  onChange,
  loading,
  hideLabel,
  showLabel,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  hideLabel: string;
  showLabel: string;
  autoComplete: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          required
          disabled={loading}
          minLength={8}
          autoComplete={autoComplete}
          className="h-11 pe-11"
        />
        <button
          type="button"
          className="absolute inset-y-0 end-0 flex min-w-11 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={onToggle}
          disabled={loading}
          aria-label={show ? hideLabel : showLabel}
        >
          {show ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
