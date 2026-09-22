export const deskSubmitClass =
  "h-11 w-full transition-colors duration-200 active:bg-primary/80";

export function DeskForgotMessages({
  error,
  success,
}: {
  error: string | null;
  success: string | null;
}) {
  const isError = Boolean(error);
  return (
    <p
      className={`min-h-5 text-sm ${isError ? "text-destructive" : "text-foreground"}`}
      role={isError ? "alert" : "status"}
      aria-live="polite"
    >
      {error ?? success}
    </p>
  );
}
