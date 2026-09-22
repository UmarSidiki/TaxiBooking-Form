export function DeskAuthShell({
  children,
  cover,
}: {
  children: React.ReactNode;
  cover: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-6 p-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-10">
        {children}
      </div>
      {cover}
    </div>
  );
}
