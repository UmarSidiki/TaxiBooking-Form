import { ApiError } from "@/shared/http/api";

export function describeAssignment(input: {
  success: boolean;
  warning?: string;
  error?: unknown;
  successLabel: string;
  failedLabel: string;
  timeOffLabel: string;
  overlapLabel: (trip: string, time: string) => string;
}) {
  if (!input.success) {
    if (input.error instanceof ApiError && input.error.detail === "driver_time_off") {
      return input.timeOffLabel;
    }
    return input.failedLabel;
  }
  const match = input.warning?.match(/Overlaps (.+) at (\d{2}:\d{2})/);
  if (match?.[1] && match[2]) return input.overlapLabel(match[1], match[2]);
  return input.successLabel;
}
