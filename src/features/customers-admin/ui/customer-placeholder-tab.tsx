import { Clock } from "lucide-react";

export function CustomerPlaceholderTab({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded border border-dashed border-border/70 p-5">
      <Clock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
