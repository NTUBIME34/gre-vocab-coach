"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitReviewAction } from "@/app/review/actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { PracticeOption, PracticeQuestion } from "@/lib/practice";
import { fetchSmartQuestions, readBestScore, writeBestScore } from "./game-data";

const ROUND_SECONDS = 60;
const QUESTION_BATCH = 50;
const BEST_KEY = "gre-game-blitz-best-score";

type BlitzStatus = "idle" | "loading" | "running" | "done" | "error";

type MissedWord = { word: string; meaning: string };

export function BlitzGame() {
  const [status, setStatus] = useState<BlitzStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [pickedWordId, setPickedWordId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [missed, setMissed] = useState<MissedWord[]>([]);
  const [failedSaves, setFailedSaves] = useState(0);
  const [remaining, setRemaining] = useState(ROUND_SECONDS);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [, startSaving] = useTransition();

  const scoreRef = useRef(0);
  const statusRef = useRef<BlitzStatus>("idle");
  const endsAtRef = useRef(0);
  const questionStartedAtRef = useRef(0);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  statusRef.current = status;
  const current = questions[index];

  useEffect(() => {
    setBestScore(readBestScore(BEST_KEY));
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (status !== "running") {
      return;
    }
    const interval = setInterval(() => {
      const secondsLeft = Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000));
      setRemaining(secondsLeft);
      if (secondsLeft <= 0) {
        finishRound();
      }
    }, 200);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Running out of questions before the clock ends the round early.
  useEffect(() => {
    if (status === "running" && questions.length > 0 && index >= questions.length) {
      finishRound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, index, questions.length]);

  async function startRound() {
    setStatus("loading");
    setMessage(null);
    try {
      const nextQuestions = await fetchSmartQuestions(QUESTION_BATCH);
      if (!nextQuestions.length) {
        setMessage("目前沒有可用的題目。");
        setStatus("error");
        return;
      }
      setQuestions(nextQuestions);
      setIndex(0);
      setPickedWordId(null);
      scoreRef.current = 0;
      setScore(0);
      setStreak(0);
      setMaxStreak(0);
      setAnsweredCount(0);
      setCorrectCount(0);
      setMissed([]);
      setFailedSaves(0);
      setRemaining(ROUND_SECONDS);
      endsAtRef.current = Date.now() + ROUND_SECONDS * 1000;
      questionStartedAtRef.current = Date.now();
      setStatus("running");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "載入失敗，請再試一次。");
      setStatus("error");
    }
  }

  function finishRound() {
    if (statusRef.current !== "running") {
      return;
    }
    statusRef.current = "done";
    setStatus("done");
    const finalScore = scoreRef.current;
    setBestScore((currentBest) => {
      if (currentBest === null || finalScore > currentBest) {
        writeBestScore(BEST_KEY, finalScore);
        return finalScore;
      }
      return currentBest;
    });
  }

  function answer(option: PracticeOption) {
    if (status !== "running" || pickedWordId || !current) {
      return;
    }

    const isCorrect = option.wordId === current.wordId;
    const responseTime = Date.now() - questionStartedAtRef.current;
    const question = current;
    setPickedWordId(option.wordId);
    setAnsweredCount((value) => value + 1);

    if (isCorrect) {
      // Streak bonus: +2 per consecutive correct answer, capped at +10.
      const gained = 10 + Math.min(streak, 5) * 2;
      scoreRef.current += gained;
      setScore(scoreRef.current);
      setCorrectCount((value) => value + 1);
      setStreak((value) => {
        const next = value + 1;
        setMaxStreak((max) => Math.max(max, next));
        return next;
      });
    } else {
      setStreak(0);
      setMissed((list) => [...list, { word: question.explanation.word, meaning: question.explanation.chineseMeaning }]);
    }

    // Same SRS write path as Practice: correct = recognition-only "good", wrong = "again".
    startSaving(async () => {
      const result = await submitReviewAction({
        wordId: question.wordId,
        rating: isCorrect ? "good" : "again",
        reviewMode: question.reviewMode,
        responseTime,
        confidenceLevel: isCorrect ? 4 : 2
      });
      if (!result.ok) {
        setFailedSaves((value) => value + 1);
      }
    });

    advanceTimerRef.current = setTimeout(
      () => {
        setPickedWordId(null);
        setIndex((value) => value + 1);
        questionStartedAtRef.current = Date.now();
      },
      isCorrect ? 350 : 950
    );
  }

  const accuracy = answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0;

  return (
    <Card>
      <CardHeader
        title="限時衝刺"
        description="60 秒內連續作答，連對有加成。答題結果與 Practice 一樣計入學習紀錄。"
        action={
          status === "running" ? (
            <div className="flex items-center gap-4 text-sm tabular-nums">
              <span
                className={`text-xl font-semibold ${
                  remaining <= 10 ? "text-rose-600 dark:text-rose-400" : "text-slate-950 dark:text-slate-50"
                }`}
              >
                {remaining}s
              </span>
              <span className="text-slate-600 dark:text-slate-400">分數 {score}</span>
              {streak >= 2 ? <span className="font-semibold text-amber-600 dark:text-amber-400">COMBO ×{streak}</span> : null}
            </div>
          ) : null
        }
      />
      <CardBody>
        {message ? (
          <p className="mb-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            {message}
          </p>
        ) : null}

        {status === "idle" || status === "error" ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">準備好了嗎？</h2>
            <ul className="mx-auto mt-3 max-w-md space-y-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
              <li>看中文意思，在選項中點出正確的單字</li>
              <li>答對 +10 分，連續答對每題再多 +2（最高 +10）</li>
              <li>答錯不扣分，但會中斷連擊並短暫顯示正解</li>
            </ul>
            {bestScore !== null ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">目前最佳紀錄：{bestScore} 分</p>
            ) : null}
            <Button type="button" className="mt-5" onClick={() => void startRound()}>
              開始 60 秒挑戰
            </Button>
          </div>
        ) : null}

        {status === "loading" ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-6 py-14 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            正在準備題目⋯
          </div>
        ) : null}

        {status === "running" && current ? (
          <div>
            <div className="rounded-lg bg-slate-50 p-5 dark:bg-slate-800">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">這個意思是哪個字？</p>
              <h2 className="mt-2 text-2xl font-semibold leading-9 text-slate-950 dark:text-slate-50">
                {current.explanation.chineseMeaning}
              </h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {current.options.map((option) => {
                const isAnswer = option.wordId === current.wordId;
                const isPicked = pickedWordId === option.wordId;
                const stateClass = pickedWordId
                  ? isAnswer
                    ? "border-emerald-500 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950"
                    : isPicked
                      ? "border-rose-500 bg-rose-50 dark:border-rose-700 dark:bg-rose-950"
                      : "border-slate-200 bg-white opacity-50 dark:border-slate-800 dark:bg-slate-900"
                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800";

                return (
                  <button
                    key={option.wordId}
                    type="button"
                    disabled={Boolean(pickedWordId)}
                    onClick={() => answer(option)}
                    className={`rounded-lg border px-4 py-3 text-left transition ${stateClass}`}
                  >
                    <span className="block text-lg font-semibold text-slate-950 dark:text-slate-50">{option.word}</span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                      {option.partOfSpeech ?? "GRE word"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {status === "done" ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-10 text-center dark:border-emerald-900 dark:bg-emerald-950">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">時間到！</p>
              <p className="mt-2 text-4xl font-semibold tabular-nums text-emerald-950 dark:text-emerald-100">{score} 分</p>
              <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
                答對 {correctCount} / {answeredCount}（{accuracy}%）· 最高連擊 ×{maxStreak}
                {bestScore !== null ? ` · 最佳紀錄 ${bestScore} 分` : ""}
              </p>
              {failedSaves > 0 ? (
                <p className="mt-3 text-sm text-rose-700 dark:text-rose-300">
                  有 {failedSaves} 筆作答紀錄儲存失敗，進度可能少計。
                </p>
              ) : null}
              <Button type="button" className="mt-5" onClick={() => void startRound()}>
                再來一局
              </Button>
            </div>

            {missed.length ? (
              <div className="rounded-lg border border-slate-200 p-5 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">這局漏掉的字（{missed.length}）</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6">
                  {missed.map((item, itemIndex) => (
                    <li key={`${item.word}-${itemIndex}`} className="flex flex-wrap gap-x-3">
                      <span className="font-semibold text-slate-950 dark:text-slate-50">{item.word}</span>
                      <span className="text-slate-600 dark:text-slate-400">{item.meaning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
