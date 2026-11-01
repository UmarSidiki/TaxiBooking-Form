import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import { ipPrefixFromValue } from "@/features/marketing/lib/ip-prefix";
import { unsubscribeWithToken } from "@/features/marketing/lib/unsubscribe/unsubscribe.service";
import { UnsubscribeResubscribe } from "@/features/marketing/ui/unsubscribe-resubscribe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ locale: string; token: string }> };

export default async function UnsubscribePage({ params }: Props) {
  const { locale, token } = await params;
  const t = await getTranslations({ locale, namespace: "Unsubscribe" });
  const requestHeaders = await headers();
  const result = await unsubscribeWithToken(token, {
    ipPrefix: ipPrefixFromValue(requestHeaders.get("x-forwarded-for")),
  });

  if (!result.ok) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 p-6">
        <h1 className="text-2xl font-semibold">{t("invalid-title")}</h1>
        <p className="text-sm text-muted-foreground">{t("invalid-body")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("body", { channel: t(`channel.${result.channel}`) })}
      </p>
      <p className="text-sm text-muted-foreground">{t("resubscribe-note")}</p>
      <UnsubscribeResubscribe token={token} />
    </main>
  );
}
