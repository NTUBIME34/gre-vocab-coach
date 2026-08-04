"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/data";
import { safeErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

// The column is unbounded `text`; without a cap a single paste could store an
// arbitrarily large note and slow every later read of that row.
const MAX_NOTES_LENGTH = 2000;

export async function updateWordNotesAction(wordId: string, notes: string) {
  const user = await requireUser();

  if (!isUuid(wordId)) {
    return { ok: false, message: "Unknown word." };
  }

  const supabase = await createClient();
  const trimmedNotes = notes.slice(0, MAX_NOTES_LENGTH);

  const { error: ensureRowError } = await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      word_id: wordId,
      next_review_at: new Date().toISOString()
    },
    { onConflict: "user_id,word_id", ignoreDuplicates: true }
  );

  if (ensureRowError) {
    return { ok: false, message: safeErrorMessage("updateWordNotes.ensureRow", ensureRowError) };
  }

  const { error } = await supabase
    .from("user_progress")
    .update({ notes: trimmedNotes })
    .eq("user_id", user.id)
    .eq("word_id", wordId);

  if (error) {
    return { ok: false, message: safeErrorMessage("updateWordNotes.update", error) };
  }

  revalidatePath(`/vocabulary/${wordId}`);
  return {
    ok: true,
    message: notes.length > MAX_NOTES_LENGTH ? `已儲存（筆記超過 ${MAX_NOTES_LENGTH} 字，已截斷）。` : "Notes saved."
  };
}
