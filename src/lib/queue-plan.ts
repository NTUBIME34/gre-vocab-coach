export type DailyQueueBudget = {
  /** How many due cards to fetch. */
  dueBudget: number;
  /** How many brand-new words may be introduced, given how many due cards came back. */
  newLimit: (dueCount: number) => number;
};

/**
 * Splits the daily workload between due reviews and brand-new words.
 *
 * The queue used to fetch due cards up to the entire daily_review_limit and only
 * offer whatever slots were left over to new words. For any collection that keeps
 * growing, the due queue eventually reaches that limit every single day, at which
 * point new words stop arriving permanently -- the learner stalls with thousands
 * of words still untouched.
 *
 * Reserving the new-word allowance up front fixes that without raising the total
 * workload the learner configured. The reservation is capped at half the limit so
 * a large daily_new_words can't starve reviews in the other direction.
 */
export function planDailyQueue({
  dailyReviewLimit,
  dailyNewWords
}: {
  dailyReviewLimit: number;
  dailyNewWords: number;
}): DailyQueueBudget {
  const totalLimit = Math.max(0, Math.floor(dailyReviewLimit));
  const wantedNew = Math.max(0, Math.floor(dailyNewWords));
  const reservedForNew = Math.min(wantedNew, Math.floor(totalLimit / 2));
  const dueBudget = Math.max(totalLimit - reservedForNew, 0);

  return {
    dueBudget,
    // Due cards that never materialized free their slots back to new words, so a
    // learner with an empty queue still gets a full intake day.
    newLimit: (dueCount: number) => Math.min(wantedNew, Math.max(totalLimit - dueCount, 0))
  };
}

/**
 * Spreads freshly tracked words over future days instead of making all of them due
 * at once. Importing a 2,000-word book used to create a 2,000-card backlog dated
 * "now", which buries the schedule and makes every later interval meaningless.
 */
export function staggeredDueDate(index: number, dailyNewWords: number, from: Date): Date {
  const perDay = Math.max(1, Math.floor(dailyNewWords));
  const dayOffset = Math.floor(index / perDay);
  const due = new Date(from.getTime());
  due.setDate(due.getDate() + dayOffset);
  return due;
}
