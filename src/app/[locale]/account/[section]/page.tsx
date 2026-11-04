import type { Viewport } from "next";
import { notFound } from "next/navigation";
import {
  renderAccountPage,
  type AccountSearchParams,
} from "@/features/customers/lib/render-account-page";
import { isAccountSubSection } from "@/features/customers/lib/account-sections";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function AccountSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<AccountSearchParams>;
}) {
  const { section } = await params;
  if (!isAccountSubSection(section)) notFound();
  return renderAccountPage(section, searchParams);
}
