export type GreetingKey = "morning" | "afternoon" | "evening";

function greetingKeyForHour(hour: number): GreetingKey {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/** Uses the operator timezone so the greeting matches the desk, not the server clock. */
export function greetingKeyInTimeZone(date: Date, timeZone: string): GreetingKey {
  try {
    const hour = Number(
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        hourCycle: "h23",
        timeZone,
      }).format(date),
    );
    if (Number.isFinite(hour)) return greetingKeyForHour(hour);
  } catch {
    // Fall through to the runtime-local clock.
  }
  return greetingKeyForHour(date.getHours());
}
