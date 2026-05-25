import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { parseVocabularyCsv, splitCsvList } from "@/lib/import/parse-vocabulary-csv";
import { createClient } from "@/lib/supabase/server";

function normalizeWord(word: string) {
  return word.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function POST(request: Request) {
  const user = await requireUser();
  const supabase = await createClient();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "Please upload a CSV file." }, { status: 400 });
  }

  const text = await file.text();
  const parsed = parseVocabularyCsv(text);

  if (!parsed.ok) {
    return NextResponse.json({ ok: false, message: parsed.errors.slice(0, 10).join("\n") }, { status: 400 });
  }

  const { data: existingWords, error: existingError } = await supabase.from("vocabulary").select("id, word");

  if (existingError) {
    return NextResponse.json({ ok: false, message: existingError.message }, { status: 500 });
  }

  const existingByWord = new Map((existingWords ?? []).map((word) => [normalizeWord(word.word), word.id]));
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

  let insertedWordIds: string[] = [];

  if (rowsToInsert.length) {
    const { data: inserted, error: insertError } = await supabase
      .from("vocabulary")
      .insert(rowsToInsert)
      .select("id");

    if (insertError) {
      return NextResponse.json({ ok: false, message: insertError.message }, { status: 500 });
    }

    insertedWordIds = (inserted ?? []).map((row) => row.id);
  }

  const allWordIds = [...existingByWord.values(), ...insertedWordIds];
  const { data: progress, error: progressError } = await supabase
    .from("user_progress")
    .select("word_id")
    .eq("user_id", user.id);

  if (progressError) {
    return NextResponse.json({ ok: false, message: progressError.message }, { status: 500 });
  }

  const existingProgressIds = new Set((progress ?? []).map((row) => row.word_id));
  const progressRows = allWordIds
    .filter((wordId) => !existingProgressIds.has(wordId))
    .map((wordId) => ({
      user_id: user.id,
      word_id: wordId,
      next_review_at: new Date().toISOString()
    }));

  if (progressRows.length) {
    const { error: progressInsertError } = await supabase.from("user_progress").insert(progressRows);

    if (progressInsertError) {
      return NextResponse.json({ ok: false, message: progressInsertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    imported: rowsToInsert.length,
    skippedDuplicates: parsed.rows.length - rowsToInsert.length,
    progressCreated: progressRows.length
  });
}
