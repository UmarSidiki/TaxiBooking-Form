import { MapPin, MessageCircle, RotateCcw, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { AccountT } from "./account-types";

export function AccountQuickActions({
  t,
  rebookHref: rebookTarget,
  hasLastRide,
  savedPlaces,
}: {
  t: AccountT;
  rebookHref: string;
  hasLastRide: boolean;
  savedPlaces: number;
}) {
  const savedLabel =
    savedPlaces > 0
      ? t("saved-places-count", { count: savedPlaces })
      : t("saved-places-none");

  return (
    <section
      aria-labelledby="quick-title"
      className="rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--sheet)] p-4 md:p-[18px]"
    >
      <h2 id="quick-title" className="m-0 text-[13px] font-semibold">
        {t("quick-actions")}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <QuickItem
          href={rebookTarget}
          icon={<RotateCcw className="size-[18px]" strokeWidth={1.7} />}
          title={t("rebook")}
          detail={hasLastRide ? t("rebook-last-route") : t("rebook-new-route")}
        />
        <QuickItem
          href="#profile"
          icon={<MapPin className="size-[18px]" strokeWidth={1.7} />}
          title={t("saved-places")}
          detail={savedLabel}
        />
        <QuickItem
          href="#phone"
          icon={<MessageCircle className="size-[18px]" strokeWidth={1.7} />}
          title={t("whatsapp")}
          detail={t("whatsapp-chat")}
        />
        <QuickItem
          href="#security"
          icon={<ShieldCheck className="size-[18px]" strokeWidth={1.7} />}
          title={t("security")}
          detail={t("security-sessions")}
        />
      </div>
    </section>
  );
}

function QuickItem({
  href,
  icon,
  title,
  detail,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <a
      href={href}
      className="flex min-h-[86px] flex-col items-start gap-2.5 rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--sheet)] p-[11px] text-start text-[var(--ink)] transition-colors duration-150 motion-reduce:transition-none hover:border-[var(--rule2)] hover:bg-[var(--well)]"
    >
      <span className="text-[var(--ink2)]">{icon}</span>
      <span>
        <b className="block text-xs font-medium leading-[1.25]">{title}</b>
        <span className="mt-0.5 block text-[10.5px] leading-[1.3] text-[var(--ink2)]">
          {detail}
        </span>
      </span>
    </a>
  );
}
