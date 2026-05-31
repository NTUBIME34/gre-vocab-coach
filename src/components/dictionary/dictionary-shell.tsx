"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

type DictionaryEntry = {
  id: string;
  word: string;
  partOfSpeech: string | null;
  chineseMeaning: string;
  englishDefinition: string | null;
  exampleSentence: string | null;
  synonyms: string[];
  antonyms: string[];
  memoryHint: string | null;
  difficultyLevel: number;
  frequencyLevel: number;
};

export function DictionaryShell() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DictionaryEntry | null>(null);
  const [suggestions, setSuggestions] = useState<DictionaryEntry[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    lookup(query);
  }

  function lookup(nextQuery: string) {
    const trimmed = nextQuery.trim();

    if (!trimmed) {
      setMessage("Please enter a GRE word or meaning.");
      return;
    }

    setQuery(trimmed);
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed })
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        result?: DictionaryEntry | null;
        suggestions?: DictionaryEntry[];
      };

      if (!payload.ok) {
        setMessage(payload.message ?? "Dictionary lookup failed.");
        return;
      }

      setResult(payload.result ?? null);
      setSuggestions(payload.suggestions ?? []);
      setHistory((items) => [trimmed, ...items.filter((item) => item !== trimmed)].slice(0, 8));
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader title="Dictionary" description="Search the GRE vocabulary bank stored in Supabase." />
        <CardBody>
          <form onSubmit={submit} className="space-y-3">
            <label className="text-sm font-medium text-slate-700" htmlFor="dictionary-query">
              Word or meaning
            </label>
            <input
              id="dictionary-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="abate, 減少, concise..."
              className="w-full rounded-md border border-slate-200 px-3 py-3 text-sm"
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Searching..." : "Search"}
            </Button>
          </form>

          {history.length ? (
            <div className="mt-6">
              <p className="text-sm font-medium text-slate-700">Recent searches</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {history.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => lookup(item)}
                    className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="space-y-6">
        {message ? <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p> : null}

        {result ? (
          <DictionaryWordCard entry={result} title="Best match" />
        ) : (
          <Card>
            <CardBody className="px-6 py-12 text-center">
              <h2 className="text-lg font-semibold text-slate-950">Search your GRE dictionary</h2>
              <p className="mt-2 text-sm text-slate-600">
                Results come from the same vocabulary table used by Review and Practice.
              </p>
            </CardBody>
          </Card>
        )}

        {suggestions.length ? (
          <Card>
            <CardHeader title="Related matches" description="Tap a word to open the full vocabulary detail page." />
            <CardBody className="grid gap-3 sm:grid-cols-2">
              {suggestions.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/vocabulary/${entry.id}`}
                  className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{entry.word}</p>
                      <p className="mt-1 text-sm text-slate-500">{entry.partOfSpeech ?? "GRE word"}</p>
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      F{entry.frequencyLevel}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-700">{entry.chineseMeaning}</p>
                </Link>
              ))}
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function DictionaryWordCard({ entry, title }: { entry: DictionaryEntry; title: string }) {
  return (
    <Card>
      <CardHeader
        title={title}
        description={`${entry.partOfSpeech ?? "GRE word"} · Difficulty ${entry.difficultyLevel} · Frequency ${entry.frequencyLevel}`}
        action={
          <Link href={`/vocabulary/${entry.id}`} className="text-sm font-medium text-slate-600 hover:text-slate-950">
            Detail
          </Link>
        }
      />
      <CardBody>
        <h2 className="text-4xl font-semibold tracking-normal text-slate-950">{entry.word}</h2>
        <div className="mt-6 grid gap-5">
          <Field label="Chinese" value={entry.chineseMeaning} />
          <Field label="Definition" value={entry.englishDefinition} />
          <Field label="Example" value={entry.exampleSentence} />
          {entry.synonyms.length ? <Field label="Synonyms" value={entry.synonyms.join(", ")} /> : null}
          {entry.antonyms.length ? <Field label="Antonyms" value={entry.antonyms.join(", ")} /> : null}
          <Field label="Memory hint" value={entry.memoryHint} />
        </div>
      </CardBody>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 leading-7 text-slate-800">{value}</p>
    </div>
  );
}
