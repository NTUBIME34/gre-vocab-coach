import { NextResponse } from "next/server";
import { getAllUserProgressRows } from "@/lib/data";
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
  let progressRows;
  try {
    // Both reads page: a truncated progress list made Practice treat words the
    // learner already knows as unseen and push them to the front of the pool.
    [vocabulary, progressRows] = await Promise.all([getVocabularyRowsCached(), getAllUserProgressRows(user.id)]);
  } catch (error) {
    console.error("[api:practice]", error);
    return NextResponse.json({ ok: false, message: "Could not load practice questions." }, { status: 500 });
  }

  const questions = buildPracticeQuestions({
    vocabulary,
    progressRows,
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
