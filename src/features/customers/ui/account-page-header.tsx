import type { ReactNode } from "react";

export function AccountPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3 md:mb-6">
      <div className="min-w-0">
        <h1 className="m-0 text-[19px] font-semibold leading-[1.2] tracking-[-0.025em] md:text-[21px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-[60ch] text-[13px] leading-[1.55] text-[var(--ink2)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}

export function AccountCard({
  id,
  title,
  description,
  children,
  className = "",
}: {
  id?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const titleId = id ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={title ? titleId : undefined}
      className={`scroll-mt-24 rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--sheet)] p-4 md:p-5 ${className}`}
    >
      {title ? (
        <div className="mb-4">
          <h2 id={titleId} className="m-0 text-[15px] font-semibold">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-xs leading-[1.6] text-[var(--ink2)]">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
