import { ArrowRight } from "lucide-react";
import type { AccountT } from "./account-types";

export function AccountConcierge({
  t,
  companyPhone,
}: {
  t: AccountT;
  companyPhone: string;
}) {
  const digits = companyPhone.replace(/\D/g, "");
  const href = digits ? `https://wa.me/${digits}` : "#phone";

  return (
    <section
      aria-labelledby="concierge-title"
      className="rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--sheet)] p-4 md:p-[18px]"
    >
      <p
        id="concierge-title"
        className="m-0 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--ink2)]"
      >
        {t("concierge")}
      </p>
      <p className="mb-3 mt-2 text-xs leading-[1.55] text-[var(--ink2)]">
        {t("concierge-copy")}
      </p>
      <a
        href={href}
        target={digits ? "_blank" : undefined}
        rel={digits ? "noreferrer" : undefined}
        className="inline-flex min-h-11 items-center gap-1.5 text-xs text-[var(--link)] hover:underline hover:underline-offset-2"
      >
        {t("concierge-message")}
        <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
      </a>
      {companyPhone ? (
        <p className="mt-2.5 text-[11.5px] tabular-nums text-[var(--ink2)]">
          {companyPhone}
        </p>
      ) : null}
    </section>
  );
}
