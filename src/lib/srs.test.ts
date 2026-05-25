import { describe, expect, it } from "vitest";
import { calculateNextReview } from "./srs";

const baseDate = new Date("2026-05-25T00:00:00.000Z");

describe("calculateNextReview", () => {
  it("schedules again for 10 minutes later", () => {
    const result = calculateNextReview({
      currentInterval: 5,
      correctCount: 2,
      wrongCount: 1,
      rating: "again",
      reviewedAt: baseDate
    });

    expect(result.reviewInterval).toBe(0);
    expect(result.wrongCount).toBe(2);
    expect(result.nextReviewAt.toISOString()).toBe("2026-05-25T00:10:00.000Z");
  });

  it("schedules hard for 1 day later", () => {
    const result = calculateNextReview({
      currentInterval: 5,
      correctCount: 2,
      wrongCount: 1,
      rating: "hard",
      reviewedAt: baseDate
    });

    expect(result.reviewInterval).toBe(1);
    expect(result.wrongCount).toBe(2);
    expect(result.nextReviewAt.toISOString()).toBe("2026-05-26T00:00:00.000Z");
  });

  it("doubles interval for good", () => {
    const result = calculateNextReview({
      currentInterval: 4,
      correctCount: 2,
      wrongCount: 1,
      rating: "good",
      reviewedAt: baseDate
    });

    expect(result.reviewInterval).toBe(8);
    expect(result.correctCount).toBe(3);
  });

  it("triples interval for easy", () => {
    const result = calculateNextReview({
      currentInterval: 4,
      correctCount: 2,
      wrongCount: 1,
      rating: "easy",
      reviewedAt: baseDate
    });

    expect(result.reviewInterval).toBe(12);
    expect(result.correctCount).toBe(3);
  });

  it("marks cards mastered when interval reaches 30 days", () => {
    const result = calculateNextReview({
      currentInterval: 15,
      correctCount: 4,
      wrongCount: 0,
      rating: "good",
      reviewedAt: baseDate
    });

    expect(result.reviewInterval).toBe(30);
    expect(result.isMastered).toBe(true);
    expect(result.familiarityLevel).toBe(5);
  });
});
