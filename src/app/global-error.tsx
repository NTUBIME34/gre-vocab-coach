"use client";

import { useEffect } from "react";

// Catches failures in the root layout itself, where app/error.tsx cannot render.
// Must ship its own <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="zh-TW">
      <body style={{ backgroundColor: "#020617", color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: "28rem", margin: "20vh auto", padding: "1.5rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600 }}>應用程式發生錯誤</h1>
          <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", lineHeight: 1.75, color: "#94a3b8" }}>
            重新載入通常就能恢復。你的複習進度都存在資料庫，不會遺失。
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              borderRadius: "0.375rem",
              backgroundColor: "#f8fafc",
              color: "#020617",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              border: "none",
              cursor: "pointer"
            }}
          >
            重新載入
          </button>
        </div>
      </body>
    </html>
  );
}
