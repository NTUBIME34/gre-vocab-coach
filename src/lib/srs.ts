import type { ReviewRating } from "@/types/database";

export type FamiliarityLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type ReviewProgressInput = {
  currentInterval: number;
  correctCount: number;
  wrongCount: number;
  rating: ReviewRating;
  reviewedAt?: Date;
  masteryIntervalDays?: number;
};

export type ReviewProgressResult = {
  familiarityLevel: FamiliarityLevel;
  correctCount: number;
  wrongCount: number;
  reviewInterval: number;
  lastReviewedAt: Date;
  nextReviewAt: Date;
  isMastered: boolean;
};

export type UserProgressUpdate = {
  familiarity_level: FamiliarityLevel;
  correct_count: number;
  wrong_count: number;
  last_reviewed_at: string;
  next_review_at: string;
  review_interval: number;
  is_mastered: boolean;
};

const MINUTE_IN_MS = 60 * 1000;
const DAY_IN_MS = 24 * 60 * MINUTE_IN_MS;
const DEFAULT_MASTERY_INTERVAL_DAYS = 30;

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MINUTE_IN_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_IN_MS);
}

export function normalizeInterval(interval: number): number {
  if (!Number.isFinite(interval) || interval < 0) {
    return 0;
  }

  return Math.round(interval);
}

export function calculateNextReview(input: ReviewProgressInput): ReviewProgressResult {
  const reviewedAt = input.reviewedAt ?? new Date();
  const currentInterval = normalizeInterval(input.currentInterval);
  const masteryIntervalDays = input.masteryIntervalDays ?? DEFAULT_MASTERY_INTERVAL_DAYS;

  if (input.rating === "again") {
    return {
      familiarityLevel: 1,
      correctCount: input.correctCount,
      wrongCount: input.wrongCount + 1,
      reviewInterval: 0,
      lastReviewedAt: reviewedAt,
      nextReviewAt: addMinutes(reviewedAt, 10),
      isMastered: false
    };
  }

  if (input.rating === "hard") {
    return {
      familiarityLevel: 2,
      correctCount: input.correctCount,
      wrongCount: input.wrongCount + 1,
      reviewInterval: 1,
      lastReviewedAt: reviewedAt,
      nextReviewAt: addDays(reviewedAt, 1),
      isMastered: false
    };
  }

  if (input.rating === "good") {
    const nextInterval = currentInterval <= 0 ? 3 : Math.max(3, Math.round(currentInterval * 2));

    return {
      familiarityLevel: nextInterval >= masteryIntervalDays ? 5 : 3,
      correctCount: input.correctCount + 1,
      wrongCount: input.wrongCount,
      reviewInterval: nextInterval,
      lastReviewedAt: reviewedAt,
      nextReviewAt: addDays(reviewedAt, nextInterval),
      isMastered: nextInterval >= masteryIntervalDays
    };
  }

  const nextInterval = currentInterval <= 0 ? 7 : Math.max(7, Math.round(currentInterval * 3));

  return {
    familiarityLevel: nextInterval >= masteryIntervalDays ? 5 : 4,
    correctCount: input.correctCount + 1,
    wrongCount: input.wrongCount,
    reviewInterval: nextInterval,
    lastReviewedAt: reviewedAt,
    nextReviewAt: addDays(reviewedAt, nextInterval),
    isMastered: nextInterval >= masteryIntervalDays
  };
}

export function buildUserProgressUpdate(result: ReviewProgressResult): UserProgressUpdate {
  return {
    familiarity_level: result.familiarityLevel,
    correct_count: result.correctCount,
    wrong_count: result.wrongCount,
    last_reviewed_at: result.lastReviewedAt.toISOString(),
    next_review_at: result.nextReviewAt.toISOString(),
    review_interval: result.reviewInterval,
    is_mastered: result.isMastered
  };
}

export function getReviewLabel(rating: ReviewRating): string {
  const labels: Record<ReviewRating, string> = {
    again: "再次複習",
    hard: "困難",
    good: "普通",
    easy: "簡單"
  };

  return labels[rating];
}

export function isDue(nextReviewAt: string | Date, now = new Date()): boolean {
  const dueAt = typeof nextReviewAt === "string" ? new Date(nextReviewAt) : nextReviewAt;
  return dueAt.getTime() <= now.getTime();
}
