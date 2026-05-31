import type { ReviewMode } from "@/types/database";
import type { UserProgressRow, VocabularyRow } from "@/lib/data";

export type PracticeMode = "smart" | "wrong" | "new" | "all";
export type PracticeQuestionType = "mixed" | "definition" | "chinese" | "cloze";

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
  const pool = selectPracticePool(vocabulary, progressByWordId, mode, now);
  const shuffled = shuffle(pool).slice(0, clamp(count, 5, 50));

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
    return wrongWords.length ? wrongWords : vocabulary;
  }

  if (mode === "new") {
    const newWords = vocabulary.filter((word) => !progressByWordId.has(word.id));
    return newWords.length ? newWords : vocabulary;
  }

  if (mode === "smart") {
    return [...vocabulary].sort((a, b) => scoreWord(b, progressByWordId, now) - scoreWord(a, progressByWordId, now));
  }

  return vocabulary;
}

function scoreWord(word: VocabularyRow, progressByWordId: ProgressMap, now: number) {
  const progress = progressByWordId.get(word.id);

  if (!progress) {
    return 70 + word.frequency_level * 2 + word.difficulty_level;
  }

  const dueBonus = new Date(progress.next_review_at).getTime() <= now && !progress.is_mastered ? 80 : 0;
  const mistakeBonus = progress.wrong_count * 12;
  const weakBonus = Math.max(0, 5 - progress.familiarity_level) * 5;
  const frequencyBonus = word.frequency_level * 2;

  return dueBonus + mistakeBonus + weakBonus + frequencyBonus;
}

function createPracticeQuestion(
  word: VocabularyRow,
  vocabulary: VocabularyRow[],
  requestedType: PracticeQuestionType,
  index: number
): PracticeQuestion | null {
  const type = chooseQuestionType(word, requestedType);
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

function chooseQuestionType(word: VocabularyRow, requestedType: PracticeQuestionType) {
  if (requestedType !== "mixed") {
    return requestedType === "cloze" && !canMakeCloze(word) ? "definition" : requestedType;
  }

  const candidates: Exclude<PracticeQuestionType, "mixed">[] = ["definition", "chinese"];
  if (canMakeCloze(word)) {
    candidates.push("cloze");
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

  return "practice_definition";
}

function createOptions(answer: VocabularyRow, vocabulary: VocabularyRow[]) {
  const samePartOfSpeech = vocabulary.filter(
    (word) => word.id !== answer.id && word.part_of_speech && word.part_of_speech === answer.part_of_speech
  );
  const backup = vocabulary.filter((word) => word.id !== answer.id);
  const distractors = shuffle(samePartOfSpeech.length >= 3 ? samePartOfSpeech : backup).slice(0, 3);

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
