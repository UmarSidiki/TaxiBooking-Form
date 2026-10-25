import { Suspense } from "react";
import { AccountDesk } from "@/features/customers/ui/account-desk";

export default function AccountPage() {
  return (
    <Suspense fallback={<p className="p-4">…</p>}>
      <AccountDesk />
    </Suspense>
  );
}
