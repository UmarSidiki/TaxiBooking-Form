import type { AccountT } from "./account-types";
import { AccountButton } from "./account-buttons";

export function AccountSecurity({
  t,
  onSignOutEverywhere,
}: {
  t: AccountT;
  onSignOutEverywhere: () => void;
}) {
  return (
    <section
      id="security"
      aria-labelledby="security-title"
      className="scroll-mt-24 rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--sheet)] p-4 md:p-5"
    >
      <h2 id="security-title" className="m-0 text-[15px] font-semibold">
        {t("security")}
      </h2>
      <p className="mb-4 mt-2 text-xs leading-[1.6] text-[var(--ink2)]">
        {t("security-copy")}
      </p>
      <AccountButton
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={onSignOutEverywhere}
      >
        {t("sign-out-everywhere")}
      </AccountButton>
    </section>
  );
}
