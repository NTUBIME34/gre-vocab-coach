"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { submitReviewAction } from "@/app/review/actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { PracticeMode, PracticeQuestion, PracticeQuestionType } from "@/lib/practice";

const modes: { value: PracticeMode; label: string; helper: string }[] = [
  { value: "smart", label: "Smart", helper: "Due, weak, and high-value words" },
  { value: "wrong", label: "Wrong", helper: "Words you have missed before" },
  { value: "new", label: "New", helper: "Words not initialized in progress yet" },
  { value: "all", label: "All", helper: "Random from the vocabulary bank" }
];

const questionTypes: { value: PracticeQuestionType; label: string }[] = [
  { value: "mixed", label: "Mixed" },
  { value: "definition", label: "Definition" },
  { value: "chinese", label: "Chinese" },
  { value: "cloze", label: "Cloze" }
];

export function PracticeShell() {
  const [mode, setMode] = useState<PracticeMode>("smart");
  const [questionType, setQuestionType] = useState<PracticeQuestionType>("mixed");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [answeredWordIds, setAnsweredWordIds] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const current = questions[index];
  const selectedOption = current?.options.find((option) => option.wordId === selectedWordId);
  const isCorrect = Boolean(current && selectedWordId === current.wordId);
  const isAnswered = Boolean(selectedWordId);
  const progressText = questions.length ? `${Math.min(index + 1, questions.length)} / ${questions.length}` : "0 / 0";
  const accuracy = useMemo(
    () => (answeredWordIds.length ? Math.round((correctCount / answeredWordIds.length) * 100) : 0),
    [answeredWordIds.length, correctCount]
  );

  useEffect(() => {
    startSession();
  }, []);

  function startSession() {
    setMessage(null);
    startLoading(async () => {
      const params = new URLSearchParams({
        mode,
        type: questionType,
        count: String(count)
      });
      const response = await fetch(`/api/practice?${params.toString()}`);
      const payload = (await response.json()) as { ok: boolean; message?: string; questions?: PracticeQuestion[] };

      if (!payload.ok) {
        setMessage(payload.message ?? "Could not load practice questions.");
        return;
      }

      setQuestions(payload.questions ?? []);
      setIndex(0);
      setSelectedWordId(null);
      setAnsweredWordIds([]);
      setCorrectCount(0);
      setStartedAt(Date.now());
    });
  }

  function answer(wordId: string) {
    if (!current || selectedWordId) {
      return;
    }

    const responseTime = Date.now() - startedAt;
    setSelectedWordId(wordId);
    setAnsweredWordIds((value) => [...value, current.wordId]);

    if (wordId === current.wordId) {
      setCorrectCount((value) => value + 1);
    }

    startSaving(async () => {
      const result = await submitReviewAction({
        wordId: current.wordId,
        rating: wordId === current.wordId ? "good" : "again",
        reviewMode: current.reviewMode,
        responseTime,
        confidenceLevel: wordId === current.wordId ? 4 : 2
      });

      if (!result.ok) {
        setMessage(result.message);
      }
    });
  }

  function nextQuestion() {
    setSelectedWordId(null);
    setStartedAt(Date.now());
    setIndex((value) => value + 1);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader title="Practice setup" description="Generate GRE-style multiple choice drills from your Supabase vocabulary." />
        <CardBody className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="practice-mode">
              Mode
            </label>
            <select
              id="practice-mode"
              value={mode}
              onChange={(event) => setMode(event.target.value as PracticeMode)}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {modes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">{modes.find((item) => item.value === mode)?.helper}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Question type</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {questionTypes.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setQuestionType(item.value)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    questionType === item.value
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="question-count">
              Questions
            </label>
            <input
              id="question-count"
              type="number"
              min={5}
              max={50}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <Button type="button" className="w-full" disabled={isLoading} onClick={startSession}>
            {isLoading ? "Loading..." : "Start new practice"}
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Practice"
          description={questions.length ? `${progressText} · Accuracy ${accuracy}%` : "Choose a mode and start a practice set."}
        />
        <CardBody>
          {message ? <p className="mb-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p> : null}

          {!questions.length ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-6 py-14 text-center">
              <h2 className="text-lg font-semibold text-slate-950">No practice questions yet</h2>
              <p className="mt-2 text-sm text-slate-600">Start a set to practice definitions, Chinese meanings, and examples.</p>
            </div>
          ) : current ? (
            <div>
              <div className="rounded-lg bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{current.type}</p>
                <h2 className="mt-3 text-2xl font-semibold leading-9 text-slate-950">{current.prompt}</h2>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {current.options.map((option, optionIndex) => {
                  const isSelected = selectedWordId === option.wordId;
                  const isAnswer = option.wordId === current.wordId;
                  const stateClass =
                    isAnswered && isAnswer
                      ? "border-emerald-500 bg-emerald-50"
                      : isAnswered && isSelected
                        ? "border-rose-500 bg-rose-50"
                        : "border-slate-200 bg-white hover:bg-slate-50";

                  return (
                    <button
                      key={option.wordId}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => answer(option.wordId)}
                      className={`min-h-28 rounded-lg border p-4 text-left transition ${stateClass}`}
                    >
                      <span className="text-xs font-semibold text-slate-500">{optionIndex + 1}</span>
                      <span className="mt-2 block text-xl font-semibold text-slate-950">{option.word}</span>
                      <span className="mt-1 block text-sm text-slate-500">{option.partOfSpeech ?? "GRE word"}</span>
                    </button>
                  );
                })}
              </div>

              {isAnswered ? (
                <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
                  <p className={`text-sm font-semibold ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                    {isCorrect ? "Correct" : `Not quite. You chose ${selectedOption?.word ?? "another option"}.`}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-slate-950">{current.explanation.word}</h3>
                  <p className="mt-2 text-slate-700">{current.explanation.chineseMeaning}</p>
                  {current.explanation.englishDefinition ? (
                    <p className="mt-2 leading-7 text-slate-700">{current.explanation.englishDefinition}</p>
                  ) : null}
                  {current.explanation.exampleSentence ? (
                    <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                      {current.explanation.exampleSentence}
                    </p>
                  ) : null}
                  {current.explanation.synonyms.length ? (
                    <p className="mt-3 text-sm text-slate-500">Synonyms: {current.explanation.synonyms.join(", ")}</p>
                  ) : null}
                  <Button type="button" className="mt-5 w-full sm:w-auto" disabled={isSaving} onClick={nextQuestion}>
                    {index + 1 >= questions.length ? "Finish" : "Next question"}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-12 text-center">
              <h2 className="text-lg font-semibold text-emerald-950">Practice complete</h2>
              <p className="mt-2 text-sm text-emerald-700">
                You answered {correctCount} of {answeredWordIds.length} correctly. Review logs and progress are saved.
              </p>
              <Button type="button" className="mt-5" onClick={startSession}>
                Practice again
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
