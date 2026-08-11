"use server";

import { z } from "zod";
import { isUuid } from "@/lib/data";
import { safeErrorMessage } from "@/lib/errors";
import { buildUserProgressUpdate, calculateNextReview } from "@/lib/srs";
import { createClient } from "@/lib/supabase/server";
import type { ReviewMode, ReviewRating } from "@/types/database";

export type SubmitReviewInput = {
  wordId: string;
  rating: ReviewRating;
  reviewMode?: ReviewMode;
  responseTime?: number;
  confidenceLevel?: number;
};

// TypeScript types vanish at runtime, so everything here arrived unchecked. The
// DB's enum and check constraints caught the worst of it, but as a 500 rather
// than a clear error -- and reviewMode is worse than a data question: it decides
// `recognitionOnly`, so a client claiming "flashcard" for a multiple-choice
// answer gets the 2x interval and can fast-track a word to mastered it never
// really earned. The whitelist below is what makes that impossible.
const MAX_RESPONSE_TIME_MS = 10 * 60 * 1000;

const submitReviewSchema = z.object({
  wordId: z.string().refine(isUuid, "Unknown word."),
  rating: z.enum(["again", "hard", "good", "easy"]),
  reviewMode: z
    .enum([
      "flashcard",
      "en_to_zh",
      "zh_to_en",
      "mistake_review",
      "practice_definition",
      "practice_chinese",
      "practice_cloze"
    ])
    .optional(),
  responseTime: z.number().int().min(0).max(MAX_RESPONSE_TIME_MS).optional(),
  confidenceLevel: z.number().int().min(1).max(5).optional()
});

export async function submitReviewAction(rawInput: SubmitReviewInput) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Please sign in before reviewing." };
  }

  const parsed = submitReviewSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { ok: false, message: "That review could not be recorded (invalid input)." };
  }

  const input = parsed.data;

  const { data: progress, error: progressError } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("word_id", input.wordId)
    .maybeSingle();

  if (progressError) {
    return { ok: false, message: safeErrorMessage("submitReview.load", progressError) };
  }

  const currentProgress = progress ?? {
    user_id: user.id,
    word_id: input.wordId,
    familiarity_level: 0,
    correct_count: 0,
    wrong_count: 0,
    last_reviewed_at: null,
    next_review_at: new Date().toISOString(),
    review_interval: 0,
    is_starred: false,
    is_mastered: false,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const nextReview = calculateNextReview({
    currentInterval: currentProgress.review_interval,
    correctCount: currentProgress.correct_count,
    wrongCount: currentProgress.wrong_count,
    rating: input.rating,
    recognitionOnly: input.reviewMode?.startsWith("practice_") ?? false
  });

  const updatePayload = buildUserProgressUpdate(nextReview);
  const { error: upsertError } = await supabase.from("user_progress").upsert({
    user_id: user.id,
    word_id: input.wordId,
    ...updatePayload
  });

  if (upsertError) {
    return { ok: false, message: safeErrorMessage("submitReview.upsert", upsertError) };
  }

  const { error: logError } = await supabase.from("review_logs").insert({
    user_id: user.id,
    word_id: input.wordId,
    review_mode: input.reviewMode ?? "flashcard",
    answer_result: input.rating,
    response_time: input.responseTime ?? null,
    confidence_level: input.confidenceLevel ?? null
  });

  if (logError) {
    return { ok: false, message: safeErrorMessage("submitReview.log", logError) };
  }

  // No revalidatePath here: every page reading this data is dynamic (cookie-based
  // auth), so navigation always refetches. Revalidating mid-session pushed a
  // re-sorted review queue into the open ReviewSession and swapped the visible
  // card out from under the user.

  return { ok: true, message: "Review saved." };
}
