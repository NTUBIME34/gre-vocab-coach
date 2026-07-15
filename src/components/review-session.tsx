"use client";

import { useMemo, useState, useTransition } from "react";
import { submitReviewAction } from "@/app/review/actions";
import { FamiliarityBadge } from "@/components/familiarity-badge";
import { Button } from "@/components/ui/button";
import type { ReviewItem } from "@/lib/data";
import type { ReviewRating } from "@/types/database";

const ratingButtons: { rating: ReviewRating; label: string; helper: string; variant: "danger" | "subtle" | "secondary" | "primary" }[] = [
  { rating: "again", label: "Again", helper: "10 min", variant: "danger" },
  { rating: "hard", label: "Hard", helper: "1 day", variant: "subtle" },
  { rating: "good", label: "Good", helper: "3+ days", variant: "secondary" },
  { rating: "easy", label: "Easy", helper: "7+ days", variant: "primary" }
];

export function ReviewSession({ items }: { items: ReviewItem[] }) {
  // Snapshot the queue once: the session works through a fixed list, so server
  // re-renders can never reorder or swap the card the user is currently rating.
  const [sessionItems] = useState(items);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  // Accumulated, never auto-cleared: with optimistic advance a failure can land
  // after the user has moved on (or finished), so every failure stays visible.
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  const current = sessionItems[index];
  const progressText = useMemo(
    () => `${Math.min(index + 1, sessionItems.length)} / ${sessionItems.length}`,
    [index, sessionItems.length]
  );

  if (!sessionItems.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">No cards due right now</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">You are clear for the moment. New cards can be added later.</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-emerald-950 dark:text-emerald-100">Review complete</h2>
          <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">Nice. Today&apos;s due queue is done.</p>
        </div>
        <SaveErrorList errors={saveErrors} />
      </div>
    );
  }

  function submit(rating: ReviewRating) {
    if (!current) {
      return;
    }

    const ratedWordId = current.word_id;
    const ratedWord = current.word;
    const responseTime = Date.now() - startedAt;

    // Advance immediately; the rating for the card just shown saves in the
    // background. A failed save is reported (with the word) but not retried --
    // the word's schedule was never updated, so it stays due and comes back.
    setIndex((value) => value + 1);
    setIsFlipped(false);
    setStartedAt(Date.now());

    startTransition(async () => {
      const result = await submitReviewAction({
        wordId: ratedWordId,
        rating,
        reviewMode: "flashcard",
        responseTime
      });

      if (!result.ok) {
        setSaveErrors((previous) => [...previous, `"${ratedWord}": ${result.message}`]);
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>{progressText}</span>
        <FamiliarityBadge level={current.familiarity_level} />
      </div>

      <button
        type="button"
        onClick={() => setIsFlipped((value) => !value)}
        className="min-h-[360px] w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-left shadow-sm transition hover:border-slate-300 dark:hover:border-slate-700 sm:p-8"
      >
        <div className="flex h-full min-h-[300px] flex-col justify-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{current.part_of_speech ?? "GRE word"}</p>
          <h2 className="mt-4 text-5xl font-semibold tracking-normal text-slate-950 dark:text-slate-50">{current.word}</h2>
          {!isFlipped ? (
            <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">Tap to reveal meaning</p>
          ) : (
            <div className="mt-8 space-y-5">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chinese</p>
                <p className="mt-1 text-xl text-slate-950 dark:text-slate-50">{current.chinese_meaning}</p>
              </div>
              {current.english_definition ? (
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Definition</p>
                  <p className="mt-1 leading-7 text-slate-800 dark:text-slate-200">{current.english_definition}</p>
                </div>
              ) : null}
              {current.example_sentence ? (
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Example</p>
                  <p className="mt-1 leading-7 text-slate-800 dark:text-slate-200">{current.example_sentence}</p>
                </div>
              ) : null}
              {current.synonyms.length ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">Synonyms: {current.synonyms.join(", ")}</p>
              ) : null}
            </div>
          )}
        </div>
      </button>

      <div className="mt-4">
        <SaveErrorList errors={saveErrors} />
      </div>

      <div className="sticky bottom-0 mt-5 grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-950 py-3">
        {ratingButtons.map((button) => (
          <Button
            key={button.rating}
            type="button"
            variant={button.variant}
            disabled={!isFlipped}
            onClick={() => submit(button.rating)}
            className="flex-col gap-1 px-2 py-3"
          >
            <span>{button.label}</span>
            <span className="text-xs opacity-75">{button.helper}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

function SaveErrorList({ errors }: { errors: string[] }) {
  if (!errors.length) {
    return null;
  }

  return (
    <div className="rounded-md bg-rose-50 dark:bg-rose-950 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
      <p className="font-medium">Some ratings could not be saved (the words stay due and will come back):</p>
      <ul className="mt-1 list-disc pl-5">
        {errors.map((error, errorIndex) => (
          <li key={errorIndex}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
