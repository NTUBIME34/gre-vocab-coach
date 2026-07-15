const labels: Record<number, string> = {
  0: "New",
  1: "Again",
  2: "Hard",
  3: "Good",
  4: "Easy",
  5: "Mastered"
};

const styles: Record<number, string> = {
  0: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  1: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  2: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  3: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  4: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  5: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
};

export function FamiliarityBadge({ level }: { level: number }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[level] ?? styles[0]}`}>
      {labels[level] ?? "New"}
    </span>
  );
}
