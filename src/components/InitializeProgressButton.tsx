"use client";

import { useState, useTransition } from "react";
import { initializeUserProgressAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";

export function InitializeProgressButton({ newWordsCount }: { newWordsCount: number }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <h2 className="text-base font-semibold text-amber-950">Add {newWordsCount} words to your review rotation</h2>
      <p className="mt-2 text-sm leading-6 text-amber-800">
        {newWordsCount} word{newWordsCount === 1 ? "" : "s"} in the vocabulary bank (e.g. from a new import) do not
        have a progress row yet, so Review and the daily new-word queue cannot schedule them. This creates one
        review row for each, safe to run anytime new vocabulary is added.
      </p>
      <Button
        type="button"
        className="mt-4"
        disabled={isPending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await initializeUserProgressAction();
            setMessage(result.message);
          });
        }}
      >
        {isPending ? "Initializing..." : "初始化我的單字進度"}
      </Button>
      {message ? <p className="mt-3 text-sm text-amber-800">{message}</p> : null}
    </div>
  );
}
