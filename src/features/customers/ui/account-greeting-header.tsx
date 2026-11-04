import { Plus } from "lucide-react";
import type { AccountT } from "./account-types";
import { AccountLink } from "./account-buttons";
import { firstName } from "./account-format";
import type { GreetingKey } from "../lib/account-greeting";

export function AccountGreetingHeader({
  t,
  name,
  greeting,
  locale,
}: {
  t: AccountT;
  name: string;
  greeting: GreetingKey;
  locale: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3 md:mb-[22px] md:gap-4">
      <div className="min-w-0">
        <h1 className="m-0 text-[19px] font-semibold leading-[1.2] tracking-[-0.025em] md:text-[21px]">
          {t(`greeting-${greeting}`, {
            name: firstName(name, t("greeting-fallback-name")),
          })}
        </h1>
        <p className="mb-0 mt-1.5 text-xs text-[var(--ink2)] md:text-[12.5px]">
          {t("greeting-subtitle")}
        </p>
      </div>
      <AccountLink
        href={`/${locale}`}
        variant="outline"
        size="sm"
        className="shrink-0 px-2.5"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        <span>{t("book-a-ride")}</span>
      </AccountLink>
    </div>
  );
}
