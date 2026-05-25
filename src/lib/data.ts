import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type VocabularyRow = Database["public"]["Tables"]["vocabulary"]["Row"];
export type UserProgressRow = Database["public"]["Tables"]["user_progress"]["Row"];
export type ReviewLogRow = Database["public"]["Tables"]["review_logs"]["Row"];
export type UserSettingsRow = Database["public"]["Tables"]["user_settings"]["Row"];

export type ProgressWithWord = UserProgressRow & {
  vocabulary: VocabularyRow | null;
};

export type ReviewItem = {
  word_id: string;
  word: string;
  part_of_speech: string | null;
  chinese_meaning: string;
  english_definition: string | null;
  example_sentence: string | null;
  synonyms: string[];
  antonyms: string[];
  memory_hint: string | null;
  difficulty_level: number;
  frequency_level: number;
  source_book_chapter: string | null;
  familiarity_level: number;
  correct_count: number;
  wrong_count: number;
  last_reviewed_at: string | null;
  next_review_at: string;
  review_interval: number;
  is_starred: boolean;
  is_mastered: boolean;
  notes: string | null;
};

export type DashboardStats = {
  dueCount: number;
  totalWords: number;
  trackedWordsCount: number;
  masteredCount: number;
  mistakeCount: number;
  reviewedTodayCount: number;
  newWordsCount: number;
  dailyReviewLimit: number;
  dailyNewWords: number;
  completionPercent: number;
};

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const settings = await getUserSettings(userId);

  const [
    dueResult,
    wordsResult,
    masteredResult,
    mistakesResult,
    reviewedTodayResult,
    progressResult
  ] = await Promise.all([
    supabase
      .from("user_progress")
      .select("word_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .lte("next_review_at", new Date().toISOString())
      .eq("is_mastered", false),
    supabase.from("vocabulary").select("id", { count: "exact", head: true }),
    supabase
      .from("user_progress")
      .select("word_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_mastered", true),
    supabase
      .from("user_progress")
      .select("word_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("wrong_count", 0),
    supabase
      .from("review_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("review_time", today.toISOString()),
    supabase.from("user_progress").select("word_id").eq("user_id", userId)
  ]);

  const totalWords = wordsResult.count ?? 0;
  const trackedWords = progressResult.data?.length ?? 0;

  return {
    dueCount: dueResult.count ?? 0,
    totalWords,
    trackedWordsCount: trackedWords,
    masteredCount: masteredResult.count ?? 0,
    mistakeCount: mistakesResult.count ?? 0,
    reviewedTodayCount: reviewedTodayResult.count ?? 0,
    newWordsCount: Math.max(totalWords - trackedWords, 0),
    dailyReviewLimit: settings.daily_review_limit,
    dailyNewWords: settings.daily_new_words,
    completionPercent: Math.min(
      100,
      Math.round(((reviewedTodayResult.count ?? 0) / Math.max(settings.daily_review_limit, 1)) * 100)
    )
  };
}

export async function getUserSettings(userId: string): Promise<UserSettingsRow> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return data;
  }

  const defaults = {
    user_id: userId,
    daily_new_words: 20,
    daily_review_limit: 100,
    dark_mode: false
  };

  const { data: inserted, error: insertError } = await supabase
    .from("user_settings")
    .insert(defaults)
    .select("*")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return inserted;
}

export async function getDueReviewItems(userId: string, limit = 100): Promise<ReviewItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_due_reviews")
    .select("*")
    .eq("user_id", userId)
    .order("next_review_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    word_id: row.word_id,
    word: row.word,
    part_of_speech: row.part_of_speech,
    chinese_meaning: row.chinese_meaning,
    english_definition: row.english_definition,
    example_sentence: row.example_sentence,
    synonyms: row.synonyms ?? [],
    antonyms: row.antonyms ?? [],
    memory_hint: row.memory_hint,
    difficulty_level: row.difficulty_level,
    frequency_level: row.frequency_level,
    source_book_chapter: row.source_book_chapter,
    familiarity_level: row.familiarity_level,
    correct_count: row.correct_count,
    wrong_count: row.wrong_count,
    last_reviewed_at: row.last_reviewed_at,
    next_review_at: row.next_review_at,
    review_interval: row.review_interval,
    is_starred: row.is_starred,
    is_mastered: row.is_mastered,
    notes: row.notes
  }));
}

export async function getTodayReviewQueue(userId: string): Promise<ReviewItem[]> {
  const supabase = await createClient();
  const settings = await getUserSettings(userId);
  const dueItems = await getDueReviewItems(userId, settings.daily_review_limit);
  const remainingSlots = Math.max(settings.daily_review_limit - dueItems.length, 0);

  if (remainingSlots <= 0) {
    return dueItems.sort((a, b) => b.wrong_count - a.wrong_count);
  }

  const newLimit = Math.min(settings.daily_new_words, remainingSlots);

  if (newLimit <= 0) {
    return dueItems.sort((a, b) => b.wrong_count - a.wrong_count);
  }

  const { data: existingProgress, error: progressError } = await supabase
    .from("user_progress")
    .select("word_id")
    .eq("user_id", userId);

  if (progressError) {
    throw new Error(progressError.message);
  }

  const existingWordIds = new Set((existingProgress ?? []).map((row) => row.word_id));
  const { data: vocabulary, error: vocabularyError } = await supabase
    .from("vocabulary")
    .select("*")
    .order("frequency_level", { ascending: false })
    .order("difficulty_level", { ascending: false })
    .order("word", { ascending: true });

  if (vocabularyError) {
    throw new Error(vocabularyError.message);
  }

  const newWords = (vocabulary ?? []).filter((word) => !existingWordIds.has(word.id)).slice(0, newLimit);

  if (!newWords.length) {
    return dueItems.sort((a, b) => b.wrong_count - a.wrong_count);
  }

  const now = new Date().toISOString();
  const progressRows = newWords.map((word) => ({
    user_id: userId,
    word_id: word.id,
    familiarity_level: 0,
    correct_count: 0,
    wrong_count: 0,
    next_review_at: now,
    review_interval: 0,
    is_mastered: false
  }));

  const { error: insertError } = await supabase.from("user_progress").insert(progressRows);

  if (insertError) {
    throw new Error(insertError.message);
  }

  const newItems: ReviewItem[] = newWords.map((word) => ({
    word_id: word.id,
    word: word.word,
    part_of_speech: word.part_of_speech,
    chinese_meaning: word.chinese_meaning,
    english_definition: word.english_definition,
    example_sentence: word.example_sentence,
    synonyms: word.synonyms ?? [],
    antonyms: word.antonyms ?? [],
    memory_hint: word.memory_hint,
    difficulty_level: word.difficulty_level,
    frequency_level: word.frequency_level,
    source_book_chapter: word.source_book_chapter,
    familiarity_level: 0,
    correct_count: 0,
    wrong_count: 0,
    last_reviewed_at: null,
    next_review_at: now,
    review_interval: 0,
    is_starred: false,
    is_mastered: false,
    notes: null
  }));

  return [...dueItems, ...newItems].sort((a, b) => b.wrong_count - a.wrong_count);
}

export async function getVocabularyList(search?: string): Promise<VocabularyRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("vocabulary")
    .select("*")
    .order("frequency_level", { ascending: false })
    .order("difficulty_level", { ascending: false })
    .order("word", { ascending: true })
    .limit(300);

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`word.ilike.${term},chinese_meaning.ilike.${term},english_definition.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getWordDetail(
  userId: string,
  wordId: string
): Promise<{ word: VocabularyRow | null; progress: UserProgressRow | null }> {
  const supabase = await createClient();
  const [wordResult, progressResult] = await Promise.all([
    supabase.from("vocabulary").select("*").eq("id", wordId).maybeSingle(),
    supabase.from("user_progress").select("*").eq("user_id", userId).eq("word_id", wordId).maybeSingle()
  ]);

  if (wordResult.error) {
    throw new Error(wordResult.error.message);
  }

  if (progressResult.error) {
    throw new Error(progressResult.error.message);
  }

  return {
    word: wordResult.data,
    progress: progressResult.data
  };
}

export async function getMistakeItems(userId: string): Promise<ProgressWithWord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_progress")
    .select("*, vocabulary(*)")
    .eq("user_id", userId)
    .gt("wrong_count", 0)
    .order("wrong_count", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProgressWithWord[];
}

export async function getStats(userId: string) {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 14);

  const [dashboard, logsResult, progressResult, mistakesResult] = await Promise.all([
    getDashboardStats(userId),
    supabase
      .from("review_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("review_time", since.toISOString())
      .order("review_time", { ascending: false }),
    supabase.from("user_progress").select("*").eq("user_id", userId),
    supabase
      .from("user_progress")
      .select("*, vocabulary(*)")
      .eq("user_id", userId)
      .gt("wrong_count", 0)
      .order("wrong_count", { ascending: false })
      .limit(5)
  ]);

  if (logsResult.error) {
    throw new Error(logsResult.error.message);
  }

  if (progressResult.error) {
    throw new Error(progressResult.error.message);
  }

  if (mistakesResult.error) {
    throw new Error(mistakesResult.error.message);
  }

  return {
    dashboard,
    recentLogs: logsResult.data ?? [],
    progressRows: progressResult.data ?? [],
    mostMissedWords: (mistakesResult.data ?? []) as ProgressWithWord[]
  };
}
