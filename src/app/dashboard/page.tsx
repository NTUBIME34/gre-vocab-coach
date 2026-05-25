import { AppShell } from "@/components/app-shell";
import { InitializeProgressButton } from "@/components/InitializeProgressButton";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data";

export default async function DashboardPage() {
  const user = await requireUser();
  const stats = await getDashboardStats(user.id);
  const shouldShowInitialize = stats.totalWords > 0 && stats.trackedWordsCount === 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Today"
        title="Dashboard"
        description="Your daily GRE vocabulary workload, mistakes, and mastery snapshot."
        action={<ButtonLink href="/review">Start review</ButtonLink>}
      />

      {shouldShowInitialize ? (
        <div className="mb-6">
          <InitializeProgressButton />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Due now" value={stats.dueCount} helper="Cards scheduled for review" />
        <StatCard label="Reviewed today" value={stats.reviewedTodayCount} helper="Completed review logs" />
        <StatCard label="Mistakes" value={stats.mistakeCount} helper="Words with wrong answers" />
        <StatCard label="Mastered" value={stats.masteredCount} helper="Interval at least 30 days" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Today&apos;s focus" description="A small queue is better than a heroic backlog." />
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total words</p>
                <p className="mt-2 text-2xl font-semibold">{stats.totalWords}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-sm text-slate-500">New words</p>
                <p className="mt-2 text-2xl font-semibold">{stats.newWordsCount}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Completion hint</p>
                <p className="mt-2 text-2xl font-semibold">{stats.dueCount === 0 ? "Clear" : "Review"}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Quick actions" />
          <CardBody className="grid gap-3">
            <ButtonLink href="/review" className="w-full">
              Review due cards
            </ButtonLink>
            <ButtonLink href="/mistakes" variant="secondary" className="w-full">
              Open mistakes
            </ButtonLink>
            <ButtonLink href="/vocabulary" variant="secondary" className="w-full">
              Browse words
            </ButtonLink>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
