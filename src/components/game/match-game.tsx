"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { fetchSmartQuestions, formatSeconds, readBestScore, shuffleItems, writeBestScore } from "./game-data";

const PAIR_COUNT = 6;
const BEST_KEY = "gre-game-match-best-seconds";

type Tile = {
  key: string;
  wordId: string;
  kind: "word" | "meaning";
  label: string;
  sub: string | null;
};

type MatchStatus = "loading" | "playing" | "done" | "error";

export function MatchGame() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [matchedWordIds, setMatchedWordIds] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [wrongKeys, setWrongKeys] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState<MatchStatus>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [bestSeconds, setBestSeconds] = useState<number | null>(null);
  const wrongFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBestSeconds(readBestScore(BEST_KEY));
    void startRound();
    return () => {
      if (wrongFlashTimer.current) {
        clearTimeout(wrongFlashTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== "playing") {
      return;
    }
    const interval = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  async function startRound() {
    setStatus("loading");
    setMessage(null);
    try {
      const questions = await fetchSmartQuestions(30);
      const seenMeanings = new Set<string>();
      const pairs: { wordId: string; word: string; meaning: string; partOfSpeech: string | null }[] = [];

      for (const question of questions) {
        const meaning = question.explanation.chineseMeaning.trim();
        // Two words sharing the exact same meaning text would make a pair ambiguous.
        if (!meaning || seenMeanings.has(meaning)) {
          continue;
        }
        seenMeanings.add(meaning);
        pairs.push({
          wordId: question.wordId,
          word: question.explanation.word,
          meaning,
          partOfSpeech: question.explanation.partOfSpeech
        });
        if (pairs.length === PAIR_COUNT) {
          break;
        }
      }

      if (pairs.length < 3) {
        setMessage("字庫可用的單字不足，無法開局。");
        setStatus("error");
        return;
      }

      setTiles(
        shuffleItems([
          ...pairs.map<Tile>((pair) => ({
            key: `word-${pair.wordId}`,
            wordId: pair.wordId,
            kind: "word",
            label: pair.word,
            sub: pair.partOfSpeech
          })),
          ...pairs.map<Tile>((pair) => ({
            key: `meaning-${pair.wordId}`,
            wordId: pair.wordId,
            kind: "meaning",
            label: pair.meaning,
            sub: null
          }))
        ])
      );
      setMatchedWordIds(new Set());
      setSelectedKey(null);
      setWrongKeys([]);
      setMistakes(0);
      setSeconds(0);
      setStatus("playing");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "載入失敗，請再試一次。");
      setStatus("error");
    }
  }

  function handleTileClick(tile: Tile) {
    if (status !== "playing" || matchedWordIds.has(tile.wordId) || wrongKeys.length) {
      return;
    }

    if (!selectedKey) {
      setSelectedKey(tile.key);
      return;
    }

    if (selectedKey === tile.key) {
      setSelectedKey(null);
      return;
    }

    const selected = tiles.find((item) => item.key === selectedKey);
    if (!selected || selected.kind === tile.kind) {
      setSelectedKey(tile.key);
      return;
    }

    if (selected.wordId === tile.wordId) {
      const nextMatched = new Set(matchedWordIds);
      nextMatched.add(tile.wordId);
      setMatchedWordIds(nextMatched);
      setSelectedKey(null);
      if (nextMatched.size === tiles.length / 2) {
        finishRound();
      }
      return;
    }

    setMistakes((value) => value + 1);
    setWrongKeys([selectedKey, tile.key]);
    setSelectedKey(null);
    wrongFlashTimer.current = setTimeout(() => setWrongKeys([]), 650);
  }

  function finishRound() {
    setStatus("done");
    if (bestSeconds === null || seconds < bestSeconds) {
      writeBestScore(BEST_KEY, seconds);
      setBestSeconds(seconds);
    }
  }

  return (
    <Card>
      <CardHeader
        title="配對消除"
        description="點一個單字、再點它的中文意思，把整個盤面清空。純熱身，不寫入學習紀錄。"
        action={
          status === "playing" ? (
            <div className="flex items-center gap-4 text-sm tabular-nums text-slate-600 dark:text-slate-400">
              <span>⏱ {formatSeconds(seconds)}</span>
              <span>失誤 {mistakes}</span>
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

        {status === "loading" ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-6 py-14 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            正在從你的弱點單字裡挑選配對組合⋯
          </div>
        ) : null}

        {status === "error" ? (
          <div className="text-center">
            <Button type="button" onClick={() => void startRound()}>
              重新載入
            </Button>
          </div>
        ) : null}

        {status === "playing" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {tiles.map((tile) => {
              const isMatched = matchedWordIds.has(tile.wordId);
              const isSelected = selectedKey === tile.key;
              const isWrong = wrongKeys.includes(tile.key);
              const stateClass = isMatched
                ? "border-emerald-300 bg-emerald-50 opacity-40 dark:border-emerald-800 dark:bg-emerald-950"
                : isWrong
                  ? "border-rose-500 bg-rose-50 dark:border-rose-600 dark:bg-rose-950"
                  : isSelected
                    ? "border-sky-500 bg-sky-50 ring-2 ring-sky-300 dark:border-sky-500 dark:bg-sky-950 dark:ring-sky-800"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800";

              return (
                <button
                  key={tile.key}
                  type="button"
                  disabled={isMatched}
                  onClick={() => handleTileClick(tile)}
                  className={`min-h-24 rounded-lg border p-3 text-left transition ${stateClass}`}
                >
                  {tile.kind === "word" ? (
                    <>
                      <span className="block text-lg font-semibold text-slate-950 dark:text-slate-50">{tile.label}</span>
                      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{tile.sub ?? "GRE word"}</span>
                    </>
                  ) : (
                    <span className="block text-sm leading-6 text-slate-700 dark:text-slate-300">{tile.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : null}

        {status === "done" ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-12 text-center dark:border-emerald-900 dark:bg-emerald-950">
            <h2 className="text-lg font-semibold text-emerald-950 dark:text-emerald-100">盤面清空！</h2>
            <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
              用時 {formatSeconds(seconds)}、失誤 {mistakes} 次
              {bestSeconds !== null ? `（最佳紀錄 ${formatSeconds(bestSeconds)}）` : ""}
            </p>
            <Button type="button" className="mt-5" onClick={() => void startRound()}>
              再玩一場
            </Button>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
