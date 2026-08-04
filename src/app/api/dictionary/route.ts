import { NextResponse } from "next/server";
import { buildContainsFilter, MAX_SEARCH_LENGTH } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";

const MAX_QUERY_LENGTH = MAX_SEARCH_LENGTH;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Please sign in before using dictionary." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { query?: string } | null;
  const query = body?.query?.trim().slice(0, MAX_QUERY_LENGTH) ?? "";

  if (!query) {
    return NextResponse.json({ ok: false, message: "Please enter a GRE word or meaning." }, { status: 400 });
  }

  const normalized = query.toLowerCase();
  // ,.()%*\"' all carry meaning inside a PostgREST or() filter -- stripped centrally.
  const filter = buildContainsFilter(["word", "chinese_meaning", "english_definition"], query);
  const exactResult = await supabase.from("vocabulary").select("*").eq("normalized_word", normalized).maybeSingle();

  if (exactResult.error) {
    console.error("[api:dictionary.exact]", exactResult.error.message);
    return NextResponse.json({ ok: false, message: "Dictionary lookup failed." }, { status: 500 });
  }

  const suggestionsResult = filter
    ? await supabase
        .from("vocabulary")
        .select("*")
        .or(filter)
        .order("frequency_level", { ascending: false })
        .order("word", { ascending: true })
        .limit(12)
    : { data: [], error: null };

  if (suggestionsResult.error) {
    console.error("[api:dictionary.suggestions]", suggestionsResult.error.message);
    return NextResponse.json({ ok: false, message: "Dictionary lookup failed." }, { status: 500 });
  }

  const exact = exactResult.data;
  const suggestions = (suggestionsResult.data ?? []).filter((word) => word.id !== exact?.id);

  return NextResponse.json({
    ok: true,
    result: exact ? toDictionaryEntry(exact) : null,
    suggestions: suggestions.map(toDictionaryEntry)
  });
}

function toDictionaryEntry(word: {
  id: string;
  word: string;
  part_of_speech: string | null;
  chinese_meaning: string;
  english_definition: string | null;
  example_sentence: string | null;
  synonyms: string[] | null;
  antonyms: string[] | null;
  memory_hint: string | null;
  difficulty_level: number;
  frequency_level: number;
}) {
  return {
    id: word.id,
    word: word.word,
    partOfSpeech: word.part_of_speech,
    chineseMeaning: word.chinese_meaning,
    englishDefinition: word.english_definition,
    exampleSentence: word.example_sentence,
    synonyms: word.synonyms ?? [],
    antonyms: word.antonyms ?? [],
    memoryHint: word.memory_hint,
    difficultyLevel: word.difficulty_level,
    frequencyLevel: word.frequency_level
  };
}
