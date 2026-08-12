import { z } from "zod";
import { isUuid } from "@/lib/data";

/**
 * Validation for a submitted review.
 *
 * The fields split into two classes, and conflating them cost real ratings:
 *
 *  - **Essential** (wordId, rating): without them there is nothing to record, so
 *    a bad value is a hard failure.
 *  - **Telemetry** (responseTime, confidenceLevel, reviewMode): nice to have for
 *    stats. A suspicious value here must never block the learner's progress --
 *    it is simply not recorded.
 *
 * The first version rejected the whole submission when responseTime exceeded ten
 * minutes. But responseTime is measured from when the card appeared, so opening
 * /review and stepping away for a coffee produced a perfectly ordinary rating
 * with a 40-minute timer attached -- and the rating was thrown away, leaving the
 * word due. Dropping the number instead of the rating fixes that, and dropping
 * (rather than clamping) also keeps the average response time honest: recording
 * a fake 10:00 would wreck an average that otherwise sits around 3 seconds.
 */
const MAX_PLAUSIBLE_RESPONSE_MS = 10 * 60 * 1000;

export const REVIEW_MODES = [
  "flashcard",
  "en_to_zh",
  "zh_to_en",
  "mistake_review",
  "practice_definition",
  "practice_chinese",
  "practice_cloze"
] as const;

export const REVIEW_RATINGS = ["again", "hard", "good", "easy"] as const;

export const reviewInputSchema = z.object({
  wordId: z.string().refine(isUuid, "Unknown word."),
  rating: z.enum(REVIEW_RATINGS),
  // An unrecognized mode falls back to "flashcard" rather than failing. It only
  // feeds the review log; the SRS-relevant half of this decision is below.
  reviewMode: z.enum(REVIEW_MODES).optional().catch(undefined),
  responseTime: z.number().int().min(0).max(MAX_PLAUSIBLE_RESPONSE_MS).optional().catch(undefined),
  confidenceLevel: z.number().int().min(1).max(5).optional().catch(undefined)
});

export type ParsedReviewInput = z.infer<typeof reviewInputSchema>;

/**
 * Whether a correct answer should grow the interval conservatively.
 *
 * Derived from the mode server-side and never trusted from the client: picking
 * the right option out of five proves recognition, not recall, so a client that
 * mislabeled a multiple-choice answer as "flashcard" would earn the full 2x
 * interval and could march a word to "mastered" it never really knew.
 */
export function isRecognitionOnly(reviewMode: ParsedReviewInput["reviewMode"]): boolean {
  return reviewMode?.startsWith("practice_") ?? false;
}
