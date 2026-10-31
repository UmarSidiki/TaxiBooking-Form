import { Clock, Home, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { AccountT } from "./account-types";

export function AccountBottomTabs({ t }: { t: AccountT }) {
  return (
    <nav
      aria-label={t("nav-account")}
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-[var(--rule)] bg-[var(--sheet)] px-2 pb-[calc(4px+env(safe-area-inset-bottom))] pt-1 md:hidden"
    >
      <Tab href="#top" icon={<Home className="size-5" strokeWidth={1.7} />} label={t("nav-home")} active />
      <Tab href="#past" icon={<Clock className="size-5" strokeWidth={1.7} />} label={t("nav-rides")} />
      <Tab href="#profile" icon={<UserRound className="size-5" strokeWidth={1.7} />} label={t("profile")} />
    </nav>
  );
}

function Tab({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-[50px] flex-col items-center justify-center gap-[3px] text-[10px] font-medium ${
        active ? "text-[var(--ink)]" : "text-[var(--ink2)]"
      }`}
    >
      {icon}
      {label}
    </a>
  );
}
