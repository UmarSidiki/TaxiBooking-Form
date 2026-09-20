/**
 * THESIS: Dispatch desk with a graphite plaque column — not a yellow SaaS shell.
 * OWN-WORLD: Limestone canvas, ink type, bronze actions, 6px plaque corners.
 * STORY: Staff scan today’s book, assign, and leave.
 * FIRST VIEWPORT: Sidebar + today’s counts; primary action is Rides.
 * FORM: Private terminal counter; seed ce80ddc4 candidate 7 (degraded roll).
 */
export default function DashboardSurfaceLayout({
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
