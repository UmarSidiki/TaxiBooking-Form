"use client";

import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { CustomerActivityTab } from "@/features/customers-admin/ui/customer-activity-tab";
import { CustomerBookingsTab } from "@/features/customers-admin/ui/customer-bookings-tab";
import { CustomerMarketingTab } from "@/features/customers-admin/ui/customer-marketing-tab";
import { CustomerNotesTab } from "@/features/customers-admin/ui/customer-notes-tab";
import { CustomerPaymentsTab } from "@/features/customers-admin/ui/customer-payments-tab";
import { CustomerSessionsTab } from "@/features/customers-admin/ui/customer-sessions-tab";
import { CustomerWhatsAppTab } from "@/features/customers-admin/ui/customer-whatsapp-tab";
import type { CustomerProfilePayload } from "@/features/customers-admin/lib/customer-profile/customer-profile.types";

export function CustomerProfileTabs({
  data,
  onRevoke,
  onRevokeAll,
  onMarketingChanged,
}: {
  data: CustomerProfilePayload;
  onRevoke: (sessionId: string) => Promise<void>;
  onRevokeAll: () => Promise<void>;
  onMarketingChanged: () => void;
}) {
  const t = useTranslations("Dashboard.CustomerProfile");

  return (
    <Tabs defaultValue="bookings" className="gap-4">
      <div className="overflow-x-auto pb-1">
        <TabsList variant="line" className="h-auto w-max min-w-full justify-start">
          <TabTrigger value="bookings" label={t("tab-bookings")} />
          <TabTrigger value="payments" label={t("tab-payments")} />
          <TabTrigger value="sessions" label={t("tab-sessions")} />
          <TabTrigger value="whatsapp" label={t("tab-whatsapp")} />
          <TabTrigger value="marketing" label={t("tab-marketing")} />
          <TabTrigger value="notes" label={t("tab-notes")} />
          <TabTrigger value="activity" label={t("tab-activity")} />
        </TabsList>
      </div>

      <TabsContent value="bookings">
        <CustomerBookingsTab
          bookings={data.bookings}
          capped={data.bookingsCapped}
          currency={data.header.currency}
        />
      </TabsContent>
      <TabsContent value="payments">
        <CustomerPaymentsTab payments={data.payments} currency={data.header.currency} />
      </TabsContent>
      <TabsContent value="sessions">
        <CustomerSessionsTab
          sessions={data.sessions}
          onRevoke={onRevoke}
          onRevokeAll={onRevokeAll}
        />
      </TabsContent>
      <TabsContent value="whatsapp">
        <CustomerWhatsAppTab whatsapp={data.whatsapp} />
      </TabsContent>
      <TabsContent value="marketing">
        <CustomerMarketingTab
          email={data.header.email}
          marketing={data.marketing}
          onChanged={onMarketingChanged}
        />
      </TabsContent>
      <TabsContent value="notes">
        <CustomerNotesTab email={data.header.email} />
      </TabsContent>
      <TabsContent value="activity">
        <CustomerActivityTab email={data.header.email} />
      </TabsContent>
    </Tabs>
  );
}

function TabTrigger({ value, label }: { value: string; label: string }) {
  return (
    <TabsTrigger value={value} className="min-h-11 px-3">
      {label}
    </TabsTrigger>
  );
}
