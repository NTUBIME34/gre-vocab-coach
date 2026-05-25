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
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const current = items[index];
  const progressText = useMemo(() => `${Math.min(index + 1, items.length)} / ${items.length}`, [index, items.length]);

  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-slate-950">No cards due right now</h2>
        <p className="mt-2 text-sm text-slate-600">You are clear for the moment. New cards can be added later.</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-emerald-950">Review complete</h2>
        <p className="mt-2 text-sm text-emerald-700">Nice. Today&apos;s due queue is done.</p>
      </div>
    );
  }

  function submit(rating: ReviewRating) {
    if (!current) {
      return;
    }

    const responseTime = Date.now() - startedAt;
    setMessage(null);
    startTransition(async () => {
      const result = await submitReviewAction({
        wordId: current.word_id,
        rating,
        reviewMode: "flashcard",
        responseTime
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setIndex((value) => value + 1);
      setIsFlipped(false);
      setStartedAt(Date.now());
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
        <span>{progressText}</span>
        <FamiliarityBadge level={current.familiarity_level} />
      </div>

      <button
        type="button"
        onClick={() => setIsFlipped((value) => !value)}
        className="min-h-[360px] w-full rounded-lg border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-slate-300 sm:p-8"
      >
        <div className="flex h-full min-h-[300px] flex-col justify-center">
          <p className="text-sm font-medium text-slate-500">{current.part_of_speech ?? "GRE word"}</p>
          <h2 className="mt-4 text-5xl font-semibold tracking-normal text-slate-950">{current.word}</h2>
          {!isFlipped ? (
            <p className="mt-8 text-sm text-slate-500">Tap to reveal meaning</p>
          ) : (
            <div className="mt-8 space-y-5">
              <div>
                <p className="text-sm font-medium text-slate-500">Chinese</p>
                <p className="mt-1 text-xl text-slate-950">{current.chinese_meaning}</p>
              </div>
              {current.english_definition ? (
                <div>
                  <p className="text-sm font-medium text-slate-500">Definition</p>
                  <p className="mt-1 leading-7 text-slate-800">{current.english_definition}</p>
                </div>
              ) : null}
              {current.example_sentence ? (
                <div>
                  <p className="text-sm font-medium text-slate-500">Example</p>
                  <p className="mt-1 leading-7 text-slate-800">{current.example_sentence}</p>
                </div>
              ) : null}
              {current.synonyms.length ? (
                <p className="text-sm text-slate-600">Synonyms: {current.synonyms.join(", ")}</p>
              ) : null}
            </div>
          )}
        </div>
      </button>

      {message ? <p className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p> : null}

      <div className="sticky bottom-0 mt-5 grid grid-cols-4 gap-2 bg-slate-50 py-3">
        {ratingButtons.map((button) => (
          <Button
            key={button.rating}
            type="button"
            variant={button.variant}
            disabled={isPending || !isFlipped}
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
