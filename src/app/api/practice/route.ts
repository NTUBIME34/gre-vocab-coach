import { NextResponse } from "next/server";
import { buildPracticeQuestions, type PracticeMode, type PracticeQuestionType } from "@/lib/practice";
import { createClient } from "@/lib/supabase/server";
import { getVocabularyRowsCached } from "@/lib/vocab-cache";

const practiceModes = new Set<PracticeMode>(["smart", "wrong", "new", "all", "target"]);
const questionTypes = new Set<PracticeQuestionType>(["mixed", "definition", "chinese", "cloze", "synonym"]);

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

  let vocabulary;
  let progressResult;
  try {
    [vocabulary, progressResult] = await Promise.all([
      getVocabularyRowsCached(),
      supabase.from("user_progress").select("*").eq("user_id", user.id)
    ]);
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Failed to load vocabulary." },
      { status: 500 }
    );
  }

  if (progressResult.error) {
    return NextResponse.json({ ok: false, message: progressResult.error.message }, { status: 500 });
  }

  const questions = buildPracticeQuestions({
    vocabulary,
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
