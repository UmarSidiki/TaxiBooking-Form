export function getRegionalDate(date: string | Date, timezone?: string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!timezone) return dateObj;

  try {
    // Create a date formatted to the specific timezone
    const tzStr = dateObj.toLocaleString('en-US', { timeZone: timezone });
    return new Date(tzStr);
  } catch (e) {
    console.error(`Invalid timezone: ${timezone}`, e);
    return dateObj;
  }
}

/**
 * Creates a Date object from a nominal date/time strings (YYYY-MM-DD, HH:mm)
 * as if they belong to the target timezone.
 * 
 * Example: date="2023-10-27", time="18:00", timezone="America/New_York"
 * Returns a Date object that IS 18:00 New York relative to the current environment.
 * 
 * This is useful for comparision against "Now" in that same timezone.
 */
export function createZonedDate(dateStr: string, timeStr: string | undefined): Date {
  const time = timeStr || '00:00';
  // Standard ISO construction (Browser Local Time)
  return new Date(`${dateStr}T${time}:00`);
}
