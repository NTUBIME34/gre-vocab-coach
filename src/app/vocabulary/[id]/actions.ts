"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function updateWordNotesAction(wordId: string, notes: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("user_progress")
    .select("word_id")
    .eq("user_id", user.id)
    .eq("word_id", wordId)
    .maybeSingle();

  if (readError) {
    return { ok: false, message: readError.message };
  }

  const { error } = existing
    ? await supabase.from("user_progress").update({ notes }).eq("user_id", user.id).eq("word_id", wordId)
    : await supabase.from("user_progress").insert({
        user_id: user.id,
        word_id: wordId,
        notes,
        next_review_at: new Date().toISOString()
      });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/vocabulary/${wordId}`);
  return { ok: true, message: "Notes saved." };
}
