"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function updateWordNotesAction(wordId: string, notes: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error: ensureRowError } = await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      word_id: wordId,
      next_review_at: new Date().toISOString()
    },
    { onConflict: "user_id,word_id", ignoreDuplicates: true }
  );

  if (ensureRowError) {
    return { ok: false, message: ensureRowError.message };
  }

  const { error } = await supabase.from("user_progress").update({ notes }).eq("user_id", user.id).eq("word_id", wordId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/vocabulary/${wordId}`);
  return { ok: true, message: "Notes saved." };
}
