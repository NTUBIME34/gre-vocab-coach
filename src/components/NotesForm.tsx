"use client";

import { useState, useTransition } from "react";
import { updateWordNotesAction } from "@/app/vocabulary/[id]/actions";
import { Button } from "@/components/ui/button";

export function NotesForm({ wordId, initialNotes }: { wordId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={6}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 outline-none ring-slate-950 transition focus:ring-2"
        placeholder="Add your memory hook, confusion note, or personal example..."
      />
      <div className="mt-3 flex items-center gap-3">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              const result = await updateWordNotesAction(wordId, notes);
              setMessage(result.message);
            });
          }}
        >
          {isPending ? "Saving..." : "Save notes"}
        </Button>
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </div>
    </div>
  );
}
