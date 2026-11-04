import { cn } from "@/shared/lib/utils";

/** Notes are plain text: React escapes the content, so HTML stays inert. */
export function AdminNoteText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <p
      dir="auto"
      className={cn("whitespace-pre-wrap break-words text-sm leading-relaxed", className)}
    >
      {text}
    </p>
  );
}
