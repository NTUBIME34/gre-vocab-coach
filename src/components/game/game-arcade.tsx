"use client";

import { useState } from "react";
import { BlitzGame } from "@/components/game/blitz-game";
import { MatchGame } from "@/components/game/match-game";

const games = [
  {
    value: "match",
    label: "配對消除",
    helper: "把單字和中文意思兩兩配對，越快清空盤面越好。純熱身，不計入學習紀錄。"
  },
  {
    value: "blitz",
    label: "限時衝刺",
    helper: "60 秒連續答題，連對有加成。答題結果與 Practice 一樣寫入學習紀錄。"
  }
] as const;

type GameKey = (typeof games)[number]["value"];

export function GameArcade() {
  const [activeGame, setActiveGame] = useState<GameKey>("match");

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {games.map((game) => (
          <button
            key={game.value}
            type="button"
            onClick={() => setActiveGame(game.value)}
            className={`rounded-lg border p-4 text-left transition ${
              activeGame === game.value
                ? "border-slate-950 bg-slate-950 text-white dark:border-slate-50 dark:bg-slate-50 dark:text-slate-950"
                : "border-slate-200 bg-white text-slate-950 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span className="block text-base font-semibold">{game.label}</span>
            <span
              className={`mt-1 block text-sm leading-6 ${
                activeGame === game.value ? "text-slate-300 dark:text-slate-600" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {game.helper}
            </span>
          </button>
        ))}
      </div>

      {activeGame === "match" ? <MatchGame /> : <BlitzGame />}
    </div>
  );
}
