"use server";

import { safeErrorMessage } from "@/lib/errors";
import { isRecognitionOnly, reviewInputSchema } from "@/lib/review-input";
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

export async function submitReviewAction(rawInput: SubmitReviewInput) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Please sign in before reviewing." };
  }

  // Only an unusable wordId or rating can fail here; odd telemetry is dropped by
  // the schema rather than costing the learner their rating. See review-input.ts.
  const parsed = reviewInputSchema.safeParse(rawInput);

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
    recognitionOnly: isRecognitionOnly(input.reviewMode)
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
