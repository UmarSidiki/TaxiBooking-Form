import type { Viewport } from "next";
import {
  renderAccountPage,
  type AccountSearchParams,
} from "@/features/customers/lib/render-account-page";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function AccountOverviewPage({
  searchParams,
}: {
  searchParams: Promise<AccountSearchParams>;
}) {
  return renderAccountPage("overview", searchParams);
}
