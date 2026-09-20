export function DeskAuthShell({
  children,
  cover,
}: {
  children: React.ReactNode;
  cover: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-6 p-6 md:p-10">
        {children}
      </div>
      {cover}
    </div>
  );
}
