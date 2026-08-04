"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getAllVocabularyRows, getTrackedWordIds, getUserSettings } from "@/lib/data";
import { safeErrorMessage } from "@/lib/errors";
import { staggeredDueDate } from "@/lib/queue-plan";
import { createClient } from "@/lib/supabase/server";

export async function initializeUserProgressAction() {
  const user = await requireUser();
  const supabase = await createClient();

  let existingWordIds: Set<string>;
  let vocabulary;
  let settings;
  try {
    // Paged read: an unpaged one stopped at 1000 rows, so this action kept
    // reporting ~1000 words to create and then quietly inserted nothing.
    [existingWordIds, vocabulary, settings] = await Promise.all([
      getTrackedWordIds(user.id),
      getAllVocabularyRows(),
      getUserSettings(user.id)
    ]);
  } catch (error) {
    return { ok: false, message: safeErrorMessage("initializeUserProgress.load", error as Error) };
  }

  const missingWords = vocabulary.filter((word) => !existingWordIds.has(word.id));

  if (!missingWords.length) {
    return { ok: true, message: "所有單字都已在複習排程中。" };
  }

  // Dating every new row "now" would dump the whole book into today's queue and
  // flatten the schedule. getAllVocabularyRows is ordered highest-frequency
  // first, so the drip introduces the highest-value words earliest.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const rowsToInsert = missingWords.map((word, index) => ({
    user_id: user.id,
    word_id: word.id,
    familiarity_level: 0,
    correct_count: 0,
    wrong_count: 0,
    next_review_at: staggeredDueDate(index, settings.daily_new_words, startOfToday).toISOString(),
    review_interval: 0,
    is_mastered: false
  }));

  const { error: insertError } = await supabase
    .from("user_progress")
    .upsert(rowsToInsert, { onConflict: "user_id,word_id", ignoreDuplicates: true });

  if (insertError) {
    return { ok: false, message: safeErrorMessage("initializeUserProgress.insert", insertError) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/review");
  revalidatePath("/stats");

  const days = Math.ceil(rowsToInsert.length / Math.max(1, settings.daily_new_words));
  return {
    ok: true,
    message: `已排入 ${rowsToInsert.length} 個單字，依每日新字量分散在約 ${days} 天內登場。`
  };
}
