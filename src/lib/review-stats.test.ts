import { describe, expect, it } from "vitest";
import { summarizeReviewLogs, type ReviewLogSample } from "./review-stats";

function log(overrides: Partial<ReviewLogSample>): ReviewLogSample {
  return {
    answer_result: "good",
    response_time: 3000,
    review_time: "2026-08-04T02:00:00.000Z",
    ...overrides
  };
}

const now = new Date("2026-08-04T12:00:00.000Z");

describe("summarizeReviewLogs", () => {
  it("counts every row it is given, not just the first page", () => {
    // The regression this guards: the query behind this summary was capped at
    // 1000 rows, so a learner with 2,887 reviews in the window saw "1000".
    const rows = Array.from({ length: 2887 }, () => log({}));

    expect(summarizeReviewLogs(rows, { days: 14, now }).total).toBe(2887);
  });

  it("derives accuracy from good and easy ratings only", () => {
    const rows = [
      log({ answer_result: "good" }),
      log({ answer_result: "easy" }),
      log({ answer_result: "hard" }),
      log({ answer_result: "again" })
    ];

    const summary = summarizeReviewLogs(rows, { days: 14, now });

    expect(summary.correct).toBe(2);
    expect(summary.accuracyPercent).toBe(50);
    expect(summary.ratingCounts).toEqual({ again: 1, hard: 1, good: 1, easy: 1 });
  });

  it("averages only the response times that were actually recorded", () => {
    const rows = [
      log({ response_time: 2000 }),
      log({ response_time: 4000 }),
      log({ response_time: null }),
      log({ response_time: 0 })
    ];

    expect(summarizeReviewLogs(rows, { days: 14, now }).averageResponseSeconds).toBe(3);
  });

  it("reports no average when nothing was timed", () => {
    const rows = [log({ response_time: null })];

    expect(summarizeReviewLogs(rows, { days: 14, now }).averageResponseSeconds).toBeNull();
  });

  it("returns one bucket per day in the window, oldest first, zero-filled", () => {
    const summary = summarizeReviewLogs([], { days: 14, now });

    expect(summary.dailyCounts).toHaveLength(14);
    expect(summary.dailyCounts[0].date).toBe("2026-07-22");
    expect(summary.dailyCounts[13].date).toBe("2026-08-04");
    expect(summary.dailyCounts.every((day) => day.count === 0)).toBe(true);
  });

  it("buckets by the learner's local day rather than UTC", () => {
    // 2026-08-03T17:30Z is already 2026-08-04 01:30 in Taipei; bucketing by UTC
    // would file an early-morning study session under the previous day.
    const rows = [log({ review_time: "2026-08-03T17:30:00.000Z" })];

    const summary = summarizeReviewLogs(rows, { days: 14, now, timeZone: "Asia/Taipei" });
    const taipeiDay = summary.dailyCounts.find((day) => day.date === "2026-08-04");

    expect(taipeiDay?.count).toBe(1);
  });

  it("handles an empty window without dividing by zero", () => {
    const summary = summarizeReviewLogs([], { days: 14, now });

    expect(summary.total).toBe(0);
    expect(summary.accuracyPercent).toBe(0);
  });
});
