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
      count: 5
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
      count: 5
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
      count: 5
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
    const weak = makeWord({ id: "weak", word: "weak", frequency_level: 5 });
    const mastered = makeWord({ id: "mastered", word: "mastered", frequency_level: 5 });
    // A third tier-5 word keeps the tier "not fully mastered" so it stays the active tier.
    const untouched = makeWord({ id: "untouched", word: "untouched", frequency_level: 5 });
    const vocabulary = [weak, mastered, untouched];
    const progressRows: UserProgressRow[] = [
      makeProgress({ word_id: "weak", familiarity_level: 1, wrong_count: 2 }),
      makeProgress({ word_id: "mastered", familiarity_level: 3 })
    ];

    const questions = buildPracticeQuestions({
      vocabulary,
      progressRows,
      mode: "target",
      questionType: "definition",
      count: 20
    });

    const order = questions.map((q) => q.wordId);
    expect(order.indexOf("weak")).toBeLessThan(order.indexOf("mastered"));
  });
});
