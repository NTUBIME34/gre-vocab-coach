import { NextResponse } from "next/server";
import { buildPracticeQuestions, type PracticeMode, type PracticeQuestionType } from "@/lib/practice";
import { createClient } from "@/lib/supabase/server";
import type { VocabularyRow } from "@/lib/data";

const practiceModes = new Set<PracticeMode>(["smart", "wrong", "new", "all"]);
const questionTypes = new Set<PracticeQuestionType>(["mixed", "definition", "chinese", "cloze"]);

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Please sign in before practicing." }, { status: 401 });
  }

  const url = new URL(request.url);
  const mode = parsePracticeMode(url.searchParams.get("mode"));
  const questionType = parseQuestionType(url.searchParams.get("type"));
  const count = Number(url.searchParams.get("count") ?? 10);

  const [vocabularyResult, progressResult] = await Promise.all([
    getAllVocabulary(),
    supabase.from("user_progress").select("*").eq("user_id", user.id)
  ]);

  if (!vocabularyResult.ok) {
    return NextResponse.json({ ok: false, message: vocabularyResult.message }, { status: 500 });
  }

  if (progressResult.error) {
    return NextResponse.json({ ok: false, message: progressResult.error.message }, { status: 500 });
  }

  const questions = buildPracticeQuestions({
    vocabulary: vocabularyResult.data,
    progressRows: progressResult.data ?? [],
    mode,
    questionType,
    count: Number.isFinite(count) ? count : 10
  });

  return NextResponse.json({ ok: true, questions });
}

function parsePracticeMode(value: string | null): PracticeMode {
  return value && practiceModes.has(value as PracticeMode) ? (value as PracticeMode) : "smart";
}

function parseQuestionType(value: string | null): PracticeQuestionType {
  return value && questionTypes.has(value as PracticeQuestionType) ? (value as PracticeQuestionType) : "mixed";
}

async function getAllVocabulary(): Promise<{ ok: true; data: VocabularyRow[] } | { ok: false; message: string }> {
  const supabase = await createClient();
  const pageSize = 1000;
  const rows: VocabularyRow[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("vocabulary")
      .select("*")
      .order("frequency_level", { ascending: false })
      .order("difficulty_level", { ascending: false })
      .order("word", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      return { ok: false, message: error.message };
    }

    rows.push(...((data ?? []) as VocabularyRow[]));

    if (!data || data.length < pageSize) {
      return { ok: true, data: rows };
    }
  }
}
