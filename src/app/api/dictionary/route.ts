import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_QUERY_LENGTH = 80;

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
  const safeTerm = query.replace(/[,%]/g, " ").trim();
  const exactResult = await supabase.from("vocabulary").select("*").eq("normalized_word", normalized).maybeSingle();

  if (exactResult.error) {
    return NextResponse.json({ ok: false, message: exactResult.error.message }, { status: 500 });
  }

  const suggestionsResult = await supabase
    .from("vocabulary")
    .select("*")
    .or(`word.ilike.%${safeTerm}%,chinese_meaning.ilike.%${safeTerm}%,english_definition.ilike.%${safeTerm}%`)
    .order("frequency_level", { ascending: false })
    .order("word", { ascending: true })
    .limit(12);

  if (suggestionsResult.error) {
    return NextResponse.json({ ok: false, message: suggestionsResult.error.message }, { status: 500 });
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
