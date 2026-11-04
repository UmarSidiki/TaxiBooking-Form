import type { AccountT } from "./account-types";

export function AccountFooter({
  t,
  brandName,
}: {
  t: AccountT;
  brandName: string;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--rule)] pt-4 text-[11px] text-[var(--ink2)] md:mt-7 md:pt-5">
      <span>
        {t("copyright", {
          year,
          name: brandName || t("brand-fallback"),
        })}
      </span>
    </footer>
  );
}
