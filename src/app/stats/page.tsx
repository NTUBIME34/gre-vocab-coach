import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getStats } from "@/lib/data";

export default async function StatsPage() {
  const user = await requireUser();
  const stats = await getStats(user.id);
  const totalReviews = stats.recentLogs.length;
  const correctReviews = stats.recentLogs.filter((log) => log.answer_result === "good" || log.answer_result === "easy").length;
  const accuracy = totalReviews ? Math.round((correctReviews / totalReviews) * 100) : 0;
  const hardWords = stats.progressRows.filter((row) => row.familiarity_level <= 2).length;
  const masteryRatio = stats.dashboard.totalWords
    ? Math.round((stats.dashboard.masteredCount / stats.dashboard.totalWords) * 100)
    : 0;
  const responseTimes = stats.recentLogs
    .map((log) => log.response_time)
    .filter((value): value is number => typeof value === "number" && value > 0);
  const averageResponseTime = responseTimes.length
    ? `${(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length / 1000).toFixed(1)}s`
    : "-";

  const ratingCounts = {
    again: stats.recentLogs.filter((log) => log.answer_result === "again").length,
    hard: stats.recentLogs.filter((log) => log.answer_result === "hard").length,
    good: stats.recentLogs.filter((log) => log.answer_result === "good").length,
    easy: stats.recentLogs.filter((log) => log.answer_result === "easy").length
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Progress"
        title="Stats"
        description="A compact view of review volume, accuracy, mastery, and weak words."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="14-day reviews" value={totalReviews} helper="Recent review logs" />
        <StatCard label="Accuracy" value={`${accuracy}%`} helper="Good or Easy ratings" />
        <StatCard label="Hard words" value={hardWords} helper="Familiarity level 0-2" />
        <StatCard label="Mastery" value={`${masteryRatio}%`} helper={`${stats.dashboard.masteredCount} mastered`} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Rating distribution" description="Last 14 days" />
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
                <div key={row.word_id} className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{row.vocabulary?.word ?? row.word_id}</p>
                    <p className="mt-1 text-sm text-slate-500">{row.vocabulary?.chinese_meaning ?? ""}</p>
                  </div>
                  <span className="text-sm font-medium text-slate-700">{row.wrong_count} wrong</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No mistakes yet.</p>
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
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-950" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-950">{value}</span>
    </div>
  );
}
