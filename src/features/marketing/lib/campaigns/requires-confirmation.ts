import {
  CAMPAIGN_CONFIRM_THRESHOLD,
  CAMPAIGN_CONFIRM_WORD,
} from "@/features/marketing/lib/marketing.constants";

/** True when a send of this size is missing the typed confirmation word. */
export function isMissingSendConfirmation(
  recipients: number,
  confirmationText: string | undefined | null,
): boolean {
  if (recipients <= CAMPAIGN_CONFIRM_THRESHOLD) return false;
  return (confirmationText ?? "").trim().toUpperCase() !== CAMPAIGN_CONFIRM_WORD;
}
