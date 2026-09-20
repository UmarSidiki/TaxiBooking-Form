/**
 * THESIS: Dispatch desk with a graphite plaque column — not a yellow SaaS shell.
 * OWN-WORLD: Limestone canvas, ink type, bronze actions, 6px plaque corners.
 */
export default function DriversSurfaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-surface="desk" className="min-h-svh bg-background text-foreground">
      {children}
    </div>
  );
}
