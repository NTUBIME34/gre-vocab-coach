import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getStats, STATS_WINDOW_DAYS } from "@/lib/data";

export default async function StatsPage() {
  const user = await requireUser();
  const stats = await getStats(user.id);
  const summary = stats.reviewSummary;
  const totalReviews = summary.total;
  const accuracy = summary.accuracyPercent;
  const ratingCounts = summary.ratingCounts;
  const hardWords = stats.progressRows.filter((row) => row.familiarity_level <= 2).length;
  const masteryRatio = stats.dashboard.totalWords
    ? Math.round((stats.dashboard.masteredCount / stats.dashboard.totalWords) * 100)
    : 0;
  const averageResponseTime =
    summary.averageResponseSeconds === null ? "-" : `${summary.averageResponseSeconds.toFixed(1)}s`;
  const peakDay = Math.max(...summary.dailyCounts.map((day) => day.count), 1);
  const dailyAverage = Math.round(totalReviews / STATS_WINDOW_DAYS);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Progress"
        title="Stats"
        description="A compact view of review volume, accuracy, mastery, and weak words."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`${STATS_WINDOW_DAYS}-day reviews`}
          value={totalReviews}
          helper={`約每天 ${dailyAverage} 次`}
        />
        <StatCard label="Accuracy" value={`${accuracy}%`} helper="Good or Easy ratings" />
        <StatCard label="Hard words" value={hardWords} helper="Familiarity level 0-2" />
        <StatCard label="Mastery" value={`${masteryRatio}%`} helper={`${stats.dashboard.masteredCount} mastered`} />
      </div>

      <Card className="mt-6">
        <CardHeader title="每日複習量" description={`過去 ${STATS_WINDOW_DAYS} 天，看得出有沒有斷檔。`} />
        <CardBody>
          <div className="flex items-end justify-between gap-1 sm:gap-2" style={{ height: "8rem" }}>
            {summary.dailyCounts.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
                  {day.count || ""}
                </span>
                <div
                  className={`w-full rounded-t ${
                    day.count ? "bg-slate-950 dark:bg-slate-50" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                  style={{ height: `${Math.max((day.count / peakDay) * 100, day.count ? 4 : 2)}%` }}
                />
                <span className="text-[10px] tabular-nums text-slate-400 dark:text-slate-500">{day.label}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Rating distribution" description={`Last ${STATS_WINDOW_DAYS} days`} />
          <CardBody className="space-y-4">
            <Bar label="Again" value={ratingCounts.again} total={Math.max(totalReviews, 1)} />
            <Bar label="Hard" value={ratingCounts.hard} total={Math.max(totalReviews, 1)} />
            <Bar label="Good" value={ratingCounts.good} total={Math.max(totalReviews, 1)} />
            <Bar label="Easy" value={ratingCounts.easy} total={Math.max(totalReviews, 1)} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Workload" description="Current queue snapshot" />
          <CardBody className="space-y-4">
            <Metric label="Due now" value={stats.dashboard.dueCount} />
            <Metric label="Total vocabulary" value={stats.dashboard.totalWords} />
            <Metric label="New words" value={stats.dashboard.newWordsCount} />
            <Metric label="Mistake words" value={stats.dashboard.mistakeCount} />
            <Metric label="Average response time" value={averageResponseTime} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Most missed words" description="Highest wrong-count words in your progress." />
          <CardBody className="grid gap-3">
            {stats.mostMissedWords.length ? (
              stats.mostMissedWords.map((row) => (
                <div key={row.word_id} className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3 dark:bg-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{row.vocabulary?.word ?? row.word_id}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{row.vocabulary?.chinese_meaning ?? ""}</p>
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.wrong_count} wrong</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No mistakes yet.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

function Bar({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = Math.round((value / total) * 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-slate-950 dark:bg-slate-50" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3 dark:bg-slate-800">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-950 dark:text-slate-50">{value}</span>
    </div>
  );
}
