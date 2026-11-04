import { redirect } from "next/navigation";
import { isMarketingEnabled } from "@/features/marketing/lib/marketing-module";

/** Marketing module off: send the desk home, like other disabled modules. */
export default async function MarketingModuleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  if (!(await isMarketingEnabled())) redirect(`/${(await params).locale}/dashboard/home`);
  return <>{children}</>;
}
