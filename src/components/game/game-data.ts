import type { PracticeQuestion } from "@/lib/practice";

// Both games draw from the same smart pool as Practice, so game rounds are
// built from due, weak, and high-value words instead of random ones.
export async function fetchSmartQuestions(count: number): Promise<PracticeQuestion[]> {
  const params = new URLSearchParams({ mode: "smart", type: "chinese", count: String(count) });
  const response = await fetch(`/api/practice?${params.toString()}`, { cache: "no-store" });
  const payload = (await response.json()) as { ok: boolean; message?: string; questions?: PracticeQuestion[] };

  if (!payload.ok) {
    throw new Error(payload.message ?? "Could not load game words.");
  }

  return payload.questions ?? [];
}

export function shuffleItems<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function readBestScore(key: string): number | null {
  const raw = window.localStorage.getItem(key);
  const value = raw === null ? NaN : Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function writeBestScore(key: string, value: number) {
  window.localStorage.setItem(key, String(value));
}

export function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
