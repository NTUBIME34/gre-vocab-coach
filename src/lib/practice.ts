import type { ReviewMode } from "@/types/database";
import type { UserProgressRow, VocabularyRow } from "@/lib/data";

export type PracticeMode = "smart" | "wrong" | "new" | "all" | "target";

const MASTERY_FAMILIARITY_THRESHOLD = 3;
export type PracticeQuestionType = "mixed" | "definition" | "chinese" | "cloze" | "synonym";

export type PracticeOption = {
  wordId: string;
  word: string;
  partOfSpeech: string | null;
  chineseMeaning: string;
  englishDefinition: string | null;
};

export type PracticeQuestion = {
  id: string;
  wordId: string;
  type: Exclude<PracticeQuestionType, "mixed">;
  reviewMode: ReviewMode;
  prompt: string;
  answerWord: string;
  options: PracticeOption[];
  explanation: {
    word: string;
    partOfSpeech: string | null;
    chineseMeaning: string;
    englishDefinition: string | null;
    exampleSentence: string | null;
    synonyms: string[];
    antonyms: string[];
  };
};

type ProgressMap = Map<string, UserProgressRow>;
const distractorCount = 4;

export function buildPracticeQuestions({
  vocabulary,
  progressRows,
  mode,
  questionType,
  count
}: {
  vocabulary: VocabularyRow[];
  progressRows: UserProgressRow[];
  mode: PracticeMode;
  questionType: PracticeQuestionType;
  count: number;
}) {
  const progressByWordId: ProgressMap = new Map(progressRows.map((row) => [row.word_id, row]));
  const now = Date.now();
  // selectPracticePool already returns words in priority order for modes that have
  // one (smart/target/wrong prioritize due, weak, or high-frequency words first;
  // all/new pre-shuffle since they have no priority order). Selecting the top N
  // BEFORE shuffling preserves that priority; only the presentation order of the
  // chosen subset is randomized afterward.
  const pool = selectPracticePool(vocabulary, progressByWordId, mode, now);
  const selected = pool.slice(0, clamp(count, 5, 50));
  const shuffled = shuffle(selected);

  return shuffled
    .map((word, index) => createPracticeQuestion(word, vocabulary, questionType, index))
    .filter((question): question is PracticeQuestion => Boolean(question));
}

function selectPracticePool(
  vocabulary: VocabularyRow[],
  progressByWordId: ProgressMap,
  mode: PracticeMode,
  now: number
) {
  if (mode === "wrong") {
    const wrongWords = vocabulary
      .filter((word) => (progressByWordId.get(word.id)?.wrong_count ?? 0) > 0)
      .sort((a, b) => (progressByWordId.get(b.id)?.wrong_count ?? 0) - (progressByWordId.get(a.id)?.wrong_count ?? 0));
    return wrongWords.length ? wrongWords : shuffle(vocabulary);
  }

  if (mode === "new") {
    const newWords = vocabulary.filter((word) => !progressByWordId.has(word.id));
    return shuffle(newWords.length ? newWords : vocabulary);
  }

  if (mode === "smart") {
    // A small random jitter breaks ties between equally-scored words so
    // back-to-back sessions don't serve an identical set; real priority gaps
    // (due bonus 80, cooldown penalty 60) dwarf it.
    return [...vocabulary]
      .map((word) => ({ word, score: scoreWord(word, progressByWordId, now) + Math.random() * 8 }))
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.word);
  }

  if (mode === "target") {
    return selectTargetPool(vocabulary, progressByWordId);
  }

  return shuffle(vocabulary);
}

// Drills the highest-value words first: only words in the highest frequency_level
// tier that isn't fully mastered yet are in scope. Once every word in a tier
// reaches the mastery threshold, the next lower tier unlocks automatically --
// no separate "current tier" needs to be stored anywhere.
function selectTargetPool(vocabulary: VocabularyRow[], progressByWordId: ProgressMap) {
  const isMastered = (word: VocabularyRow) =>
    (progressByWordId.get(word.id)?.familiarity_level ?? 0) >= MASTERY_FAMILIARITY_THRESHOLD;

  const tiersHighToLow = [5, 4, 3, 2, 1];
  const unlockedTiers = new Set<number>();

  for (const tier of tiersHighToLow) {
    unlockedTiers.add(tier);
    const tierWords = vocabulary.filter((word) => word.frequency_level === tier);
    const tierFullyMastered = tierWords.length > 0 && tierWords.every(isMastered);
    if (!tierFullyMastered) {
      break;
    }
  }

  const pool = vocabulary.filter((word) => unlockedTiers.has(word.frequency_level));
  return pool.sort((a, b) => targetScore(b, progressByWordId) - targetScore(a, progressByWordId));
}

function targetScore(word: VocabularyRow, progressByWordId: ProgressMap) {
  const progress = progressByWordId.get(word.id);

  if (!progress) {
    return 100 + word.frequency_level;
  }

  if (progress.familiarity_level < MASTERY_FAMILIARITY_THRESHOLD) {
    return 60 + word.frequency_level * 2 + progress.wrong_count * 5;
  }

  return word.frequency_level;
}

const RECENT_REVIEW_COOLDOWN_MS = 12 * 60 * 60 * 1000;

function scoreWord(word: VocabularyRow, progressByWordId: ProgressMap, now: number) {
  const progress = progressByWordId.get(word.id);

  if (!progress) {
    return 70 + word.frequency_level * 2 + word.difficulty_level;
  }

  // Mastered words still earn the due bonus when their (long) interval lapses:
  // spaced repetition never retires a card, it just sees it less often.
  const isDue = new Date(progress.next_review_at).getTime() <= now;
  const dueBonus = isDue ? 80 : 0;
  // Net mistakes, not lifetime mistakes: each correct answer cancels one earlier
  // wrong and the bonus is capped, so a word the user has since relearned stops
  // crowding every session out of the pool.
  const netMistakes = Math.max(0, progress.wrong_count - progress.correct_count);
  const mistakeBonus = Math.min(36, netMistakes * 12);
  const weakBonus = Math.max(0, 5 - progress.familiarity_level) * 5;
  const frequencyBonus = word.frequency_level * 2;
  // A word answered within the last 12h that isn't due yet steps aside so the
  // pool rotates instead of re-serving what the user just practiced. Due words
  // are exempt: an "again" rating 10 minutes ago should come right back.
  const lastReviewedAt = progress.last_reviewed_at ? new Date(progress.last_reviewed_at).getTime() : null;
  const cooldownPenalty =
    !isDue && lastReviewedAt !== null && now - lastReviewedAt < RECENT_REVIEW_COOLDOWN_MS ? 60 : 0;

  return dueBonus + mistakeBonus + weakBonus + frequencyBonus - cooldownPenalty;
}

function createPracticeQuestion(
  word: VocabularyRow,
  vocabulary: VocabularyRow[],
  requestedType: PracticeQuestionType,
  index: number
): PracticeQuestion | null {
  const type = chooseQuestionType(word, requestedType, vocabulary);

  if (type === "synonym") {
    return createSynonymQuestion(word, vocabulary, index);
  }

  const options = createOptions(word, vocabulary);

  if (options.length < 2) {
    return null;
  }

  const prompt =
    type === "definition"
      ? word.english_definition
        ? `Which word best matches this definition: ${word.english_definition}`
        : `Which word best matches this meaning: ${word.chinese_meaning}`
      : type === "chinese"
        ? `Which word best matches this Chinese meaning: ${word.chinese_meaning}`
        : buildClozePrompt(word);

  return {
    id: `${word.id}-${type}-${index}`,
    wordId: word.id,
    type,
    reviewMode: reviewModeForType(type),
    prompt,
    answerWord: word.word,
    options,
    explanation: {
      word: word.word,
      partOfSpeech: word.part_of_speech,
      chineseMeaning: word.chinese_meaning,
      englishDefinition: word.english_definition,
      exampleSentence: word.example_sentence,
      synonyms: word.synonyms ?? [],
      antonyms: word.antonyms ?? []
    }
  };
}

function createSynonymQuestion(
  word: VocabularyRow,
  vocabulary: VocabularyRow[],
  index: number
): PracticeQuestion | null {
  const match = findSynonymMatch(word, vocabulary);

  if (!match) {
    return null;
  }

  const options = createOptions(match, vocabulary, [word.id]);

  if (options.length < 2) {
    return null;
  }

  return {
    id: `${word.id}-synonym-${index}`,
    wordId: match.id,
    type: "synonym",
    reviewMode: reviewModeForType("synonym"),
    prompt: `Which word is closest in meaning to "${word.word}" (${word.chinese_meaning})?`,
    answerWord: match.word,
    options,
    explanation: {
      word: match.word,
      partOfSpeech: match.part_of_speech,
      chineseMeaning: match.chinese_meaning,
      englishDefinition: match.english_definition,
      exampleSentence: match.example_sentence,
      synonyms: match.synonyms ?? [],
      antonyms: match.antonyms ?? []
    }
  };
}

// Two vocabulary rows are treated as synonym-matched if either one's recorded
// synonym list names the other's headword. Only rows that exist in the
// vocabulary bank qualify -- a synonym string with no matching row can't be
// turned into a real multiple-choice option.
function findSynonymMatch(word: VocabularyRow, vocabulary: VocabularyRow[]): VocabularyRow | null {
  const ownSynonyms = new Set((word.synonyms ?? []).map((s) => s.toLowerCase()));
  const matches = vocabulary.filter((candidate) => {
    if (candidate.id === word.id) {
      return false;
    }
    if (ownSynonyms.has(candidate.word.toLowerCase())) {
      return true;
    }
    return (candidate.synonyms ?? []).some((s) => s.toLowerCase() === word.word.toLowerCase());
  });

  if (!matches.length) {
    return null;
  }

  return matches[Math.floor(Math.random() * matches.length)];
}

function chooseQuestionType(word: VocabularyRow, requestedType: PracticeQuestionType, vocabulary: VocabularyRow[]) {
  if (requestedType !== "mixed") {
    if (requestedType === "cloze" && !canMakeCloze(word)) {
      return "definition";
    }
    if (requestedType === "synonym" && !findSynonymMatch(word, vocabulary)) {
      return "definition";
    }
    return requestedType;
  }

  const candidates: Exclude<PracticeQuestionType, "mixed">[] = ["definition", "chinese"];
  if (canMakeCloze(word)) {
    candidates.push("cloze");
  }
  if (findSynonymMatch(word, vocabulary)) {
    candidates.push("synonym");
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function canMakeCloze(word: VocabularyRow) {
  return Boolean(word.example_sentence?.toLowerCase().includes(word.word.toLowerCase()));
}

function buildClozePrompt(word: VocabularyRow) {
  const sentence = word.example_sentence ?? "";
  const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blanked = sentence.replace(new RegExp(escaped, "gi"), "_____");

  return `Choose the word that best completes the sentence: ${blanked || sentence}`;
}

function reviewModeForType(type: Exclude<PracticeQuestionType, "mixed">): ReviewMode {
  if (type === "chinese") {
    return "practice_chinese";
  }

  if (type === "cloze") {
    return "practice_cloze";
  }

  // "synonym" shares this bucket too -- adding a dedicated review_mode enum value
  // would require a DB migration, and both types test word-recognition the same way.
  return "practice_definition";
}

function createOptions(answer: VocabularyRow, vocabulary: VocabularyRow[], excludeIds: string[] = []) {
  const excluded = new Set([answer.id, ...excludeIds]);
  const samePartOfSpeech = vocabulary.filter(
    (word) => !excluded.has(word.id) && word.part_of_speech && word.part_of_speech === answer.part_of_speech
  );
  const backup = vocabulary.filter((word) => !excluded.has(word.id));
  const distractors = shuffle(samePartOfSpeech.length >= distractorCount ? samePartOfSpeech : backup).slice(
    0,
    distractorCount
  );

  return shuffle([answer, ...distractors]).map((word) => ({
    wordId: word.id,
    word: word.word,
    partOfSpeech: word.part_of_speech,
    chineseMeaning: word.chinese_meaning,
    englishDefinition: word.english_definition
  }));
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
