import type { FormEvent } from "react";
import type { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  deskSubmitClass,
  DeskForgotMessages,
} from "@/features/auth/ui/desk-forgot-messages";

export function DeskForgotPasswordStep({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  error,
  success,
  onPassword,
  t,
}: {
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  loading: boolean;
  error: string | null;
  success: string | null;
  onPassword: (event: FormEvent<HTMLFormElement>) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <form className="mt-8 space-y-5" onSubmit={onPassword}>
      <div className="space-y-2">
        <Label htmlFor="newPassword">{t("new_password")}</Label>
        <Input
          id="newPassword"
          name="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          disabled={loading}
          minLength={8}
          aria-invalid={error ? true : undefined}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("confirm_password")}</Label>
        <Input
          id="confirmPassword"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          disabled={loading}
          minLength={8}
          aria-invalid={error ? true : undefined}
          className="h-11"
        />
      </div>
      <DeskForgotMessages error={error} success={success} />
      <Button type="submit" disabled={loading} className={deskSubmitClass}>
        {loading ? t("resetting") : t("reset")}
      </Button>
    </form>
  );
}
