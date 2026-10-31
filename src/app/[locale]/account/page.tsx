import { AccountDesk } from "@/features/customers/ui/account-desk";
import { legacyCustomerEmail } from "@/features/customers/lib/legacy-customer-token";

type Params = { token?: string | string[]; link?: string | string[] };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const legacyToken = first(params.token);
  return (
    <AccountDesk
      expiredLink={Boolean(legacyToken) || first(params.link) === "expired"}
      prefilledEmail={legacyToken ? legacyCustomerEmail(legacyToken) ?? "" : ""}
    />
  );
}
