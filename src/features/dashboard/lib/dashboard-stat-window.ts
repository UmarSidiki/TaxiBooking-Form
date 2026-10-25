export type DashboardStatWindow = {
  now: Date;
  nowInTz: Date;
  lastMonth: Date;
  currentMonth: Date;
  timeZone: string;
};

/** Same cutoffs the previous in-memory dashboard used. */
export function dashboardStatWindow(now: Date, timeZone: string): DashboardStatWindow {
  const wall = now.toLocaleString("en-US", { timeZone, hour12: false });
  return {
    now,
    nowInTz: new Date(wall),
    lastMonth: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    currentMonth: new Date(now.getFullYear(), now.getMonth(), 1),
    timeZone,
  };
}
