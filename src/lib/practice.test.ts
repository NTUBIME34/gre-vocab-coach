import { describe, expect, it } from "vitest";
import { buildPracticeQuestions } from "./practice";
import type { UserProgressRow, VocabularyRow } from "./data";

function makeWord(overrides: Partial<VocabularyRow> & { id: string; word: string }): VocabularyRow {
  return {
    normalized_word: overrides.word.toLowerCase(),
    part_of_speech: "adj.",
    chinese_meaning: `${overrides.word} 的中文意思`,
    english_definition: `definition of ${overrides.word}`,
    example_sentence: null,
    synonyms: [],
    antonyms: [],
    memory_hint: null,
    difficulty_level: 3,
    frequency_level: 3,
    source_book_chapter: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

function makeProgress(overrides: Partial<UserProgressRow> & { word_id: string }): UserProgressRow {
  return {
    user_id: "user-1",
    familiarity_level: 0,
    correct_count: 0,
    wrong_count: 0,
    last_reviewed_at: null,
    next_review_at: "2026-01-01T00:00:00.000Z",
    review_interval: 0,
    is_starred: false,
    is_mastered: false,
    notes: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

describe("buildPracticeQuestions synonym type", () => {
  it("builds a synonym question when a real vocabulary row matches", () => {
    const laconic = makeWord({ id: "1", word: "laconic", synonyms: ["terse"] });
    const terse = makeWord({ id: "2", word: "terse", synonyms: ["laconic"] });
    const filler = [3, 4, 5, 6].map((n) => makeWord({ id: String(n), word: `filler${n}`, synonyms: [] }));
    const vocabulary = [laconic, terse, ...filler];

    const questions = buildPracticeQuestions({
      vocabulary,
      progressRows: [],
      mode: "all",
      questionType: "synonym",
      count: 10
    });

    const laconicQuestion = questions.find((q) => q.prompt.includes("laconic"));
    expect(laconicQuestion?.type).toBe("synonym");
    expect(laconicQuestion?.answerWord).toBe("terse");
    expect(laconicQuestion?.options.some((o) => o.wordId === laconicQuestion.wordId)).toBe(true);
  });

  it("falls back to definition when no synonym row exists in the vocabulary bank", () => {
    const solo = makeWord({ id: "1", word: "solo", synonyms: ["nonexistentword"] });
    const filler = [2, 3, 4, 5, 6].map((n) => makeWord({ id: String(n), word: `filler${n}` }));
    const vocabulary = [solo, ...filler];

    const questions = buildPracticeQuestions({
      vocabulary,
      progressRows: [],
      mode: "all",
      questionType: "synonym",
      count: 10
    });

    const soloQuestion = questions.find((q) => q.wordId === "1" || q.answerWord === "solo");
    expect(soloQuestion?.type).toBe("definition");
  });

  it("matches synonyms bidirectionally (either row may name the other)", () => {
    const a = makeWord({ id: "1", word: "alpha", synonyms: [] });
    const b = makeWord({ id: "2", word: "beta", synonyms: ["alpha"] });
    const filler = [3, 4, 5, 6].map((n) => makeWord({ id: String(n), word: `filler${n}` }));
    const vocabulary = [a, b, ...filler];

    const questions = buildPracticeQuestions({
      vocabulary,
      progressRows: [],
      mode: "all",
      questionType: "synonym",
      count: 10
    });

    expect(questions.some((q) => q.type === "synonym")).toBe(true);
  });
});

describe("buildPracticeQuestions target mode", () => {
  it("only drills the highest frequency tier while it still has unmastered words", () => {
    const tier5 = [1, 2].map((n) => makeWord({ id: `t5-${n}`, word: `hi${n}`, frequency_level: 5 }));
    const tier1 = [1, 2].map((n) => makeWord({ id: `t1-${n}`, word: `lo${n}`, frequency_level: 1 }));
    const vocabulary = [...tier5, ...tier1];

    const questions = buildPracticeQuestions({
      vocabulary,
      progressRows: [],
      mode: "target",
      questionType: "definition",
      count: 20
    });

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.wordId.startsWith("t5-"))).toBe(true);
  });

  it("unlocks the next tier down once the top tier is fully mastered", () => {
    const tier5 = [1, 2].map((n) => makeWord({ id: `t5-${n}`, word: `hi${n}`, frequency_level: 5 }));
    const tier4 = [1, 2].map((n) => makeWord({ id: `t4-${n}`, word: `mid${n}`, frequency_level: 4 }));
    const vocabulary = [...tier5, ...tier4];
    const progressRows: UserProgressRow[] = tier5.map((w) => makeProgress({ word_id: w.id, familiarity_level: 3 }));

    const questions = buildPracticeQuestions({
      vocabulary,
      progressRows,
      mode: "target",
      questionType: "definition",
      count: 20
    });

    const wordIds = new Set(questions.map((q) => q.wordId));
    expect([...wordIds].some((id) => id.startsWith("t4-"))).toBe(true);
  });

  it("prioritizes unmastered words within the unlocked tier over already-mastered ones", () => {
    // Selection (not display order) carries the priority: with 5 weak + 20 mastered
    // tier-5 words and count=5, the 5 selected questions must all be weak words.
    const weakWords = [1, 2, 3, 4, 5].map((n) => makeWord({ id: `weak-${n}`, word: `weak${n}`, frequency_level: 5 }));
    const masteredWords = Array.from({ length: 20 }, (_, i) =>
      makeWord({ id: `mastered-${i}`, word: `mastered${i}`, frequency_level: 5 })
    );
    const vocabulary = [...weakWords, ...masteredWords];
    const progressRows: UserProgressRow[] = [
      ...weakWords.map((w) => makeProgress({ word_id: w.id, familiarity_level: 1, wrong_count: 2 })),
      ...masteredWords.map((w) => makeProgress({ word_id: w.id, familiarity_level: 3 }))
    ];

    const questions = buildPracticeQuestions({
      vocabulary,
      progressRows,
      mode: "target",
      questionType: "definition",
      count: 5
    });

    expect(questions).toHaveLength(5);
    expect(questions.every((q) => q.wordId.startsWith("weak-"))).toBe(true);
  });
});

describe("buildPracticeQuestions smart mode", () => {
  it("keeps serving mastered words once their long interval lapses", () => {
    // A due-but-mastered word must outrank unseen low-frequency words:
    // mastery lowers a card's frequency of appearance, it never retires it.
    const masteredDue = makeWord({ id: "mastered-due", word: "mastereddue", frequency_level: 3 });
    const fillers = Array.from({ length: 10 }, (_, i) =>
      makeWord({ id: `unseen-${i}`, word: `unseen${i}`, frequency_level: 1, difficulty_level: 1 })
    );
    const progressRows: UserProgressRow[] = [
      makeProgress({
        word_id: "mastered-due",
        familiarity_level: 5,
        is_mastered: true,
        review_interval: 30,
        next_review_at: "2026-01-01T00:00:00.000Z"
      })
    ];

    const questions = buildPracticeQuestions({
      vocabulary: [masteredDue, ...fillers],
      progressRows,
      mode: "smart",
      questionType: "definition",
      count: 5
    });

    expect(questions.some((q) => q.wordId === "mastered-due")).toBe(true);
  });
});
