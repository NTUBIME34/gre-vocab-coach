import { describe, expect, it } from "vitest";
import { isRecognitionOnly, reviewInputSchema } from "./review-input";

const wordId = "3f1c8a2e-9b4d-4c7a-8e5f-1a2b3c4d5e6f";

function parse(overrides: Record<string, unknown> = {}) {
  return reviewInputSchema.safeParse({ wordId, rating: "good", reviewMode: "flashcard", ...overrides });
}

describe("reviewInputSchema", () => {
  it("accepts an ordinary review", () => {
    const result = parse({ responseTime: 4200 });

    expect(result.success).toBe(true);
    expect(result.success && result.data.responseTime).toBe(4200);
  });

  it("keeps the rating when the learner walked away mid-card", () => {
    // The regression this guards: responseTime is measured from when the card
    // appeared, so stepping away for 40 minutes produced a normal rating with an
    // absurd timer. Rejecting the submission threw the rating away and left the
    // word due -- exactly what a learner reported hitting repeatedly.
    const result = parse({ responseTime: 40 * 60 * 1000 });

    expect(result.success).toBe(true);
    expect(result.success && result.data.rating).toBe("good");
    expect(result.success && result.data.responseTime).toBeUndefined();
  });

  it("drops rather than clamps an implausible time, so averages stay honest", () => {
    const result = parse({ responseTime: 60 * 60 * 1000 });

    // A clamped 10:00 would swamp an average that normally sits near 3s.
    expect(result.success && result.data.responseTime).toBeUndefined();
  });

  it("drops other malformed telemetry without failing", () => {
    for (const bad of [{ responseTime: -5 }, { responseTime: 1.5 }, { confidenceLevel: 99 }, { reviewMode: "bogus" }]) {
      const result = parse(bad);
      expect(result.success).toBe(true);
    }
  });

  it("still rejects input it cannot record at all", () => {
    expect(parse({ wordId: "not-a-uuid" }).success).toBe(false);
    expect(parse({ rating: "sort-of" }).success).toBe(false);
  });
});

describe("isRecognitionOnly", () => {
  it("treats multiple-choice practice as recognition", () => {
    expect(isRecognitionOnly("practice_definition")).toBe(true);
    expect(isRecognitionOnly("practice_chinese")).toBe(true);
    expect(isRecognitionOnly("practice_cloze")).toBe(true);
  });

  it("treats flashcards and an unknown mode as full recall", () => {
    expect(isRecognitionOnly("flashcard")).toBe(false);
    expect(isRecognitionOnly(undefined)).toBe(false);
  });
});
