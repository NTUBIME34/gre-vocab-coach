import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";
import { requireUser } from "@/lib/auth";
import { getTrackedWordIds } from "@/lib/data";
import { parseVocabularyCsv, splitCsvList } from "@/lib/import/parse-vocabulary-csv";
import { createAdminClient } from "@/lib/supabase/admin";
import { chunkRows, writeInChunks } from "@/lib/supabase/batch";
import { fetchAllPages } from "@/lib/supabase/paginate";
import { createClient } from "@/lib/supabase/server";
import { invalidateVocabularyCache } from "@/lib/vocab-cache";

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

function normalizeWord(word: string) {
  return word.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function POST(request: Request) {
  const user = await requireUser();

  // `vocabulary` is one shared table for every account and this route writes to
  // it with the service-role client, which bypasses RLS. Signup is open, so
  // "signed in" is not a sufficient check -- any account could otherwise rewrite
  // the word bank for everyone.
  if (!isAdminUser(user.id)) {
    return NextResponse.json({ ok: false, message: "This account cannot import vocabulary." }, { status: 403 });
  }

  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "Please upload a CSV file." }, { status: 400 });
  }

  // Guard before reading: file.text() buffers the whole upload into the
  // function's memory, so an oversized file is a denial of service.
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { ok: false, message: `CSV is too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).` },
      { status: 413 }
    );
  }

  const text = await file.text();
  const parsed = parseVocabularyCsv(text);

  if (!parsed.ok) {
    return NextResponse.json({ ok: false, message: parsed.errors.slice(0, 10).join("\n") }, { status: 400 });
  }

  let existingWords: { id: string; word: string }[];
  try {
    existingWords = await fetchAllPages<{ id: string; word: string }>((from, to) =>
      adminSupabase.from("vocabulary").select("id, word").order("id").range(from, to)
    );
  } catch (error) {
    console.error("[api:import.existing]", error);
    return NextResponse.json({ ok: false, message: "Could not read the vocabulary bank." }, { status: 500 });
  }

  const existingByWord = new Map(existingWords.map((word) => [normalizeWord(word.word), word.id]));
  const seen = new Set<string>();
  const rowsToInsert = parsed.rows
    .filter((row) => {
      const key = normalizeWord(row.word);
      if (seen.has(key) || existingByWord.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .map((row) => ({
      word: row.word,
      part_of_speech: row.part_of_speech || null,
      chinese_meaning: row.chinese_meaning,
      english_definition: row.english_definition || null,
      example_sentence: row.example_sentence || null,
      synonyms: splitCsvList(row.synonyms),
      antonyms: splitCsvList(row.antonyms),
      memory_hint: row.memory_hint || null,
      difficulty_level: row.difficulty_level,
      frequency_level: row.frequency_level,
      source_book_chapter: row.source_book_chapter || null
    }));

  const insertedWordIds: string[] = [];

  if (rowsToInsert.length) {
    // Chunked for two reasons: one request carrying a whole book is a timeout
    // risk, and the `.select("id")` that returns the new ids is itself subject to
    // the 1000-row read cap -- inserting more than 1000 words at once would hand
    // back only 1000 ids, so the rest would never get a progress row.
    for (const chunk of chunkRows(rowsToInsert)) {
      const { data: inserted, error: insertError } = await adminSupabase
        .from("vocabulary")
        .insert(chunk)
        .select("id");

      if (insertError) {
        console.error("[api:import.insert]", insertError.message);
        return NextResponse.json({ ok: false, message: "Could not save the imported words." }, { status: 500 });
      }

      insertedWordIds.push(...(inserted ?? []).map((row) => row.id));
    }

    invalidateVocabularyCache();
  }

  const allWordIds = [...existingByWord.values(), ...insertedWordIds];
  let existingProgressIds: Set<string>;
  try {
    existingProgressIds = await getTrackedWordIds(user.id);
  } catch (error) {
    console.error("[api:import.progress]", error);
    return NextResponse.json({ ok: false, message: "Could not read your progress rows." }, { status: 500 });
  }

  const progressRows = allWordIds
    .filter((wordId) => !existingProgressIds.has(wordId))
    .map((wordId) => ({
      user_id: user.id,
      word_id: wordId,
      next_review_at: new Date().toISOString()
    }));

  if (progressRows.length) {
    const progressInsertError = await writeInChunks(progressRows, (chunk) =>
      supabase.from("user_progress").upsert(chunk, { onConflict: "user_id,word_id", ignoreDuplicates: true })
    );

    if (progressInsertError) {
      console.error("[api:import.progressInsert]", progressInsertError.message);
      return NextResponse.json({ ok: false, message: "Could not create your progress rows." }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    imported: rowsToInsert.length,
    skippedDuplicates: parsed.rows.length - rowsToInsert.length,
    progressCreated: progressRows.length
  });
}
