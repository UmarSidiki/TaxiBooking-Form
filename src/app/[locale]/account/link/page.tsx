import type { Metadata } from "next";
import { AccountLinkSignIn } from "@/features/customers/ui/account-link-sign-in";

export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function AccountLinkPage() {
  return <AccountLinkSignIn />;
}
