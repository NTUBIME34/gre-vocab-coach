"use client";

import { useState, useTransition } from "react";
import { initializeUserProgressAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";

export function InitializeProgressButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <h2 className="text-base font-semibold text-amber-950">Initialize your vocabulary progress</h2>
      <p className="mt-2 text-sm leading-6 text-amber-800">
        Your account has no progress rows yet. Create one review row for each word in the vocabulary table so
        Review can start scheduling cards for you.
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
