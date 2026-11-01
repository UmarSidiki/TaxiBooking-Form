"use client";

import { useTranslations } from "next-intl";

import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import { CustomerProfileHeader } from "@/features/customers-admin/ui/customer-profile-header";
import { CustomerProfileTabs } from "@/features/customers-admin/ui/customer-profile-tabs";
import {
  CustomerProfileBlocked,
  CustomerProfileLoading,
} from "@/features/customers-admin/ui/customer-profile-status";
import { profileDisplayName } from "@/features/customers-admin/ui/customer-profile-format";
import { useCustomerProfile } from "@/features/customers-admin/hooks/use-customer-profile";

export function CustomerProfilePage({ id }: { id: string }) {
  const t = useTranslations("Dashboard.CustomerProfile");
  const profile = useCustomerProfile(id);
  const data = profile.data;
  const title = data
    ? profileDisplayName(data.header.name, data.header.email)
    : t("title");
  const blocked =
    profile.state === "not_found" ||
    profile.state === "forbidden" ||
    profile.state === "error"
      ? profile.state
      : null;

  return (
    <div className="flex flex-col gap-5">
      <DeskPageMeta title={title} description={data?.header.email} />

      {data ? (
        <>
          <CustomerProfileHeader header={data.header} />
          <CustomerProfileTabs
            data={data}
            onRevoke={profile.revokeSession}
            onRevokeAll={profile.revokeAllSessions}
          />
        </>
      ) : blocked ? (
        <CustomerProfileBlocked kind={blocked} onRetry={profile.reload} />
      ) : (
        <CustomerProfileLoading />
      )}
    </div>
  );
}
