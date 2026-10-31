import type { ReactNode } from "react";

const itemClass =
  "flex min-h-11 w-full items-center rounded-[var(--radius-sm)] px-2.5 text-start text-[12.5px] text-[var(--ink)] hover:bg-[var(--well)] md:min-h-0 md:h-[34px]";

export function AccountMenuLink({
  href,
  onSelect,
  children,
}: {
  href: string;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <a role="menuitem" href={href} className={itemClass} onClick={onSelect}>
      {children}
    </a>
  );
}

export function AccountMenuAction({
  onSelect,
  children,
}: {
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      role="menuitem"
      type="button"
      className={itemClass}
      onClick={() => {
        onSelect();
      }}
    >
      {children}
    </button>
  );
}
