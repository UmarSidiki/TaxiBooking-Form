import { z } from "zod";
import { REVIEW_ID_BATCH_LIMIT } from "@/features/reviews/lib/review-batch-limit";
import { mongoIdSchema } from "@/shared/schema/mongo-id";

export const reviewListQuerySchema = z.object({
  bookingId: z.string().optional(),
  bookingIds: z.string().optional(),
});

/** Parse a comma-separated booking id list. Null means the query is invalid. */
export function parseReviewBookingIds(raw: string | undefined) {
  if (!raw) return [];
  const ids = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const parsed = z.array(mongoIdSchema).max(REVIEW_ID_BATCH_LIMIT).safeParse(ids);
  return parsed.success ? parsed.data : null;
}
