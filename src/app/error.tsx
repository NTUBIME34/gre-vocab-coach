"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="dark flex min-h-[60vh] items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 text-center">
        <h1 className="text-lg font-semibold text-slate-50">這個頁面出了點問題</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          資料載入失敗了。你的複習進度沒有受到影響，重試一次通常就會恢復。
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-slate-50 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
          >
            重試
          </button>
          <a
            href="/dashboard"
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 ring-1 ring-slate-700 transition hover:bg-slate-800"
          >
            回到 Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
