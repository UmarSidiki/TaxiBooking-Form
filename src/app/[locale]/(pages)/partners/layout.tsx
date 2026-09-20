/**
 * THESIS: Affiliate overflow desk in the same private terminal as admin.
 */
export default function PartnersSurfaceLayout({
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
