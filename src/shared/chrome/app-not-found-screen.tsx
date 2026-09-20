import { Button } from "@/shared/ui/button";
import { Link } from "@/shared/i18n/navigation";

export function AppNotFoundScreen({
  title,
  description,
  homeLabel,
  homeHref = "/",
}: {
  title: string;
  description: string;
  homeLabel: string;
  homeHref?: string;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6">
          <Button asChild className="h-11">
            <Link href={homeHref}>{homeLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
