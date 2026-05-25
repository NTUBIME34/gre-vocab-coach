"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function initializeUserProgressAction() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existingProgress, error: existingError } = await supabase
    .from("user_progress")
    .select("word_id")
    .eq("user_id", user.id);

  if (existingError) {
    return { ok: false, message: existingError.message };
  }

  const existingWordIds = new Set((existingProgress ?? []).map((row) => row.word_id));

  const { data: vocabulary, error: vocabularyError } = await supabase.from("vocabulary").select("id");

  if (vocabularyError) {
    return { ok: false, message: vocabularyError.message };
  }

  const rowsToInsert = (vocabulary ?? [])
    .filter((word) => !existingWordIds.has(word.id))
    .map((word) => ({
      user_id: user.id,
      word_id: word.id,
      familiarity_level: 0,
      correct_count: 0,
      wrong_count: 0,
      next_review_at: new Date().toISOString(),
      review_interval: 0,
      is_mastered: false
    }));

  if (!rowsToInsert.length) {
    return { ok: true, message: "Progress is already initialized." };
  }

  const { error: insertError } = await supabase.from("user_progress").insert(rowsToInsert);

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  await supabase.from("user_settings").upsert({
    user_id: user.id,
    daily_new_words: 20,
    daily_review_limit: 100,
    dark_mode: false
  });

  revalidatePath("/dashboard");
  revalidatePath("/review");
  revalidatePath("/stats");

  return { ok: true, message: `Initialized ${rowsToInsert.length} words.` };
}
