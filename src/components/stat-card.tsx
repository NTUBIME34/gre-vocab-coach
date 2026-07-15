import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 dark:text-slate-50">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p> : null}
    </Card>
  );
}
