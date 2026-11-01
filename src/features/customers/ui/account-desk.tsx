"use client";

import { AccountLogin } from "./account-login";
import { AccountHome } from "./account-home";
import type {
  AccountRides,
  CancelPolicyTier,
  CustomerProfile,
} from "./account-types";
import type { GreetingKey } from "../lib/account-greeting";
import type { AccountSection } from "../lib/account-sections";
import {
  EMPTY_ACCOUNT_RIDES,
  useAccountDesk,
} from "../hooks/use-account-desk";

export function AccountDesk({
  section = "overview",
  expiredLink = false,
  prefilledEmail = "",
  brandName = "",
  logoUrl = "",
  initialEmail = "",
  initialRides = EMPTY_ACCOUNT_RIDES,
  initialProfile = null,
  initialGreeting = "afternoon",
  currency = "EUR",
  timezone = "Europe/Zurich",
  companyPhone = "",
  cancelPolicy = null,
}: {
  section?: AccountSection;
  expiredLink?: boolean;
  prefilledEmail?: string;
  brandName?: string;
  logoUrl?: string;
  initialEmail?: string;
  initialRides?: AccountRides;
  initialProfile?: CustomerProfile | null;
  initialGreeting?: GreetingKey;
  currency?: string;
  timezone?: string;
  companyPhone?: string;
  cancelPolicy?: CancelPolicyTier[] | null;
}) {
  const desk = useAccountDesk({
    expiredLink,
    initialEmail,
    prefilledEmail,
    initialRides,
    initialProfile,
    initialGreeting,
    currency,
    timezone,
  });
  const { notice, error, noBooking } = desk.feedback;

  if (desk.phase !== "trips") {
    return (
      <AccountLogin
        t={desk.t}
        email={desk.email}
        onEmailChange={desk.editEmail}
        code={desk.code}
        setCode={desk.setCode}
        phase={desk.phase === "code" ? "code" : "login"}
        expired={expiredLink}
        noBooking={noBooking}
        error={error}
        notice={notice}
        brandName={brandName}
        logoUrl={logoUrl}
        whatsapp={desk.whatsapp}
        onSend={desk.send}
        onVerify={desk.verify}
        onUseDifferentEmail={desk.useDifferentEmail}
      />
    );
  }

  return (
    <AccountHome
      section={section}
      email={desk.email || initialEmail}
      profile={desk.profile}
      greeting={desk.greeting}
      rides={desk.rides}
      locale={desk.locale}
      currency={currency}
      companyPhone={companyPhone}
      cancelPolicy={cancelPolicy}
      brandName={brandName}
      logoUrl={logoUrl}
      onRefresh={desk.refresh}
      onProfileSaved={desk.setProfile}
      onLogout={desk.logout}
      onSignOutEverywhere={desk.signOutEverywhere}
    />
  );
}
