import { APP_TIME_ZONE, localDateKey } from "@/lib/time";
import type { ReviewRating } from "@/types/database";

export type ReviewLogSample = {
  answer_result: ReviewRating;
  response_time: number | null;
  review_time: string;
};

export type ReviewLogSummary = {
  total: number;
  correct: number;
  accuracyPercent: number;
  ratingCounts: Record<ReviewRating, number>;
  averageResponseSeconds: number | null;
  /** One entry per day in the window, oldest first. */
  dailyCounts: { date: string; label: string; count: number }[];
};

const RATINGS: ReviewRating[] = ["again", "hard", "good", "easy"];

// Reviews are bucketed by the learner's local day, not UTC. Studying at 1am in
// Taipei is 5pm UTC the day before, which would otherwise land on the wrong bar.
// Shared with the dashboard's "today" so the two never disagree again.
const DEFAULT_TIME_ZONE = APP_TIME_ZONE;

const dateKey = localDateKey;

export function summarizeReviewLogs(
  rows: ReviewLogSample[],
  { days, now, timeZone = DEFAULT_TIME_ZONE }: { days: number; now: Date; timeZone?: string }
): ReviewLogSummary {
  const ratingCounts = { again: 0, hard: 0, good: 0, easy: 0 } as Record<ReviewRating, number>;
  let responseTimeSum = 0;
  let responseTimeCount = 0;
  const perDay = new Map<string, number>();

  for (const row of rows) {
    if (RATINGS.includes(row.answer_result)) {
      ratingCounts[row.answer_result] += 1;
    }

    if (typeof row.response_time === "number" && row.response_time > 0) {
      responseTimeSum += row.response_time;
      responseTimeCount += 1;
    }

    const key = dateKey(new Date(row.review_time), timeZone);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }

  const total = rows.length;
  const correct = ratingCounts.good + ratingCounts.easy;

  const dailyCounts = Array.from({ length: days }, (_, offset) => {
    const day = new Date(now.getTime());
    day.setDate(day.getDate() - (days - 1 - offset));
    const key = dateKey(day, timeZone);
    return { date: key, label: key.slice(5).replace("-", "/"), count: perDay.get(key) ?? 0 };
  });

  return {
    total,
    correct,
    accuracyPercent: total ? Math.round((correct / total) * 100) : 0,
    ratingCounts,
    averageResponseSeconds: responseTimeCount ? responseTimeSum / responseTimeCount / 1000 : null,
    dailyCounts
  };
}
