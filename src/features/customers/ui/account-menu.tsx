"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";
import type { AccountT } from "./account-types";
import { accountHref } from "../lib/account-sections";
import { displayName, initials } from "./account-format";
import {
  AccountMenuAction as MenuAction,
  AccountMenuLink as MenuLink,
} from "./account-menu-item";

export function AccountMenu({
  t,
  locale,
  name,
  email,
  onLogout,
  onSignOutEverywhere,
}: {
  t: AccountT;
  locale: string;
  name: string;
  email: string;
  onLogout: () => void;
  onSignOutEverywhere: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const label = displayName(name, email);
  const avatar = initials(label, email);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    if (items.length === 0) return;
    event.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Home") return items[0]!.focus();
    if (event.key === "End") return items[items.length - 1]!.focus();
    const step = event.key === "ArrowDown" ? 1 : -1;
    items[(current + step + items.length) % items.length]!.focus();
  };

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu"
        aria-label={`${avatar}, ${t("account-menu-label")}`}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full text-[var(--ink2)] md:min-h-0 md:h-[34px]"
      >
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-full border border-[var(--rule)] bg-[var(--well)] text-[10.5px] font-semibold tracking-[0.02em]"
        >
          {avatar}
        </span>
        <ChevronDown className="size-3" aria-hidden="true" />
      </button>

      {open ? (
        <div
          ref={menuRef}
          id="account-menu"
          role="menu"
          aria-label={t("account-menu-label")}
          onKeyDown={onMenuKeyDown}
          className="absolute end-0 top-[calc(100%+8px)] z-50 w-[252px] rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--sheet)] p-1.5 shadow-lg"
        >
          <div className="mb-1 border-b border-[var(--rule)] px-2.5 pb-2.5 pt-2">
            <b className="block text-[12.5px] font-semibold">{label}</b>
            <span className="mt-px block truncate text-[11px] text-[var(--ink2)]">
              {email}
            </span>
          </div>
          <MenuLink href={accountHref(locale, "profile")} onSelect={close}>
            {t("menu-profile")}
          </MenuLink>
          <MenuLink href={accountHref(locale, "profile", "places")} onSelect={close}>
            {t("menu-saved-places")}
          </MenuLink>
          <MenuLink href={accountHref(locale, "rides")} onSelect={close}>
            {t("menu-rides-receipts")}
          </MenuLink>
          <MenuLink href={accountHref(locale, "notifications")} onSelect={close}>
            {t("nav-notifications")}
          </MenuLink>
          <MenuLink href={accountHref(locale, "security")} onSelect={close}>
            {t("menu-security")}
          </MenuLink>
          <div className="my-1 h-px bg-[var(--rule)]" role="separator" />
          <MenuAction onSelect={onLogout}>{t("logout")}</MenuAction>
          <MenuAction onSelect={onSignOutEverywhere}>
            {t("sign-out-everywhere")}
          </MenuAction>
        </div>
      ) : null}
    </div>
  );
}
