import { describe, expect, it } from "vitest";
import { planDailyQueue, staggeredDueDate } from "./queue-plan";

describe("planDailyQueue", () => {
  const plentyOfNewWords = 2000;

  it("still admits new words when the due queue could fill the whole limit", () => {
    // The regression this guards: due cards used to be fetched up to the entire
    // daily limit, so a saturated queue permanently starved new words.
    const budget = planDailyQueue({
      dailyReviewLimit: 100,
      dailyNewWords: 20,
      availableNewWords: plentyOfNewWords
    });

    expect(budget.dueBudget).toBe(80);
    expect(budget.newLimit(80)).toBe(20);
  });

  it("fills the whole limit with reviews once every word is already tracked", () => {
    // Reserving slots for new words that do not exist left the learner with a
    // permanently short queue -- 80 cards when they asked for 100, and nothing
    // available to fill the other 20.
    const budget = planDailyQueue({ dailyReviewLimit: 100, dailyNewWords: 20, availableNewWords: 0 });

    expect(budget.dueBudget).toBe(100);
    expect(budget.newLimit(100)).toBe(0);
  });

  it("reserves only as many slots as there are new words left", () => {
    const budget = planDailyQueue({ dailyReviewLimit: 100, dailyNewWords: 20, availableNewWords: 3 });

    expect(budget.dueBudget).toBe(97);
    expect(budget.newLimit(97)).toBe(3);
  });

  it("never exceeds the configured daily workload", () => {
    const budget = planDailyQueue({
      dailyReviewLimit: 100,
      dailyNewWords: 20,
      availableNewWords: plentyOfNewWords
    });
    const dueCount = budget.dueBudget;

    expect(dueCount + budget.newLimit(dueCount)).toBeLessThanOrEqual(100);
  });

  it("gives unused due slots back to new words", () => {
    const budget = planDailyQueue({
      dailyReviewLimit: 100,
      dailyNewWords: 20,
      availableNewWords: plentyOfNewWords
    });

    expect(budget.newLimit(0)).toBe(20);
    expect(budget.newLimit(5)).toBe(20);
  });

  it("caps the new-word reservation at half the limit so reviews cannot starve", () => {
    const budget = planDailyQueue({
      dailyReviewLimit: 40,
      dailyNewWords: 200,
      availableNewWords: plentyOfNewWords
    });

    expect(budget.dueBudget).toBe(20);
    expect(budget.newLimit(20)).toBe(20);
  });

  it("returns no new words when the learner turned them off", () => {
    const budget = planDailyQueue({
      dailyReviewLimit: 100,
      dailyNewWords: 0,
      availableNewWords: plentyOfNewWords
    });

    expect(budget.dueBudget).toBe(100);
    expect(budget.newLimit(0)).toBe(0);
  });
});

describe("staggeredDueDate", () => {
  const start = new Date("2026-08-04T00:00:00.000Z");

  it("keeps the first batch due today and pushes later batches out a day at a time", () => {
    expect(staggeredDueDate(0, 20, start).toISOString().slice(0, 10)).toBe("2026-08-04");
    expect(staggeredDueDate(19, 20, start).toISOString().slice(0, 10)).toBe("2026-08-04");
    expect(staggeredDueDate(20, 20, start).toISOString().slice(0, 10)).toBe("2026-08-05");
    expect(staggeredDueDate(41, 20, start).toISOString().slice(0, 10)).toBe("2026-08-06");
  });

  it("treats a zero daily allowance as one per day instead of dividing by zero", () => {
    expect(staggeredDueDate(3, 0, start).toISOString().slice(0, 10)).toBe("2026-08-07");
  });
});
