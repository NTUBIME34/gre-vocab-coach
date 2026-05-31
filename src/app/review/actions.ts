"use server";

import { revalidatePath } from "next/cache";
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

export async function submitReviewAction(input: SubmitReviewInput) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Please sign in before reviewing." };
  }

  const { data: progress, error: progressError } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("word_id", input.wordId)
    .maybeSingle();

  if (progressError) {
    return { ok: false, message: progressError.message };
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
    rating: input.rating
  });

  const updatePayload = buildUserProgressUpdate(nextReview);
  const { error: upsertError } = await supabase.from("user_progress").upsert({
    user_id: user.id,
    word_id: input.wordId,
    ...updatePayload
  });

  if (upsertError) {
    return { ok: false, message: upsertError.message };
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
    return { ok: false, message: logError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/review");
  revalidatePath("/practice");
  revalidatePath("/mistakes");
  revalidatePath("/stats");
  revalidatePath(`/words/${input.wordId}`);

  return { ok: true, message: "Review saved." };
}
