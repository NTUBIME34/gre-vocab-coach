import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { FamiliarityBadge } from "@/components/familiarity-badge";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { WordFields } from "@/components/word-fields";
import { requireUser } from "@/lib/auth";
import { getWordDetail } from "@/lib/data";

export default async function VocabularyDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { word, progress } = await getWordDetail(user.id, id);

  if (!word) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={word.source_book_chapter ?? "Vocabulary"}
        title={word.word}
        description={word.part_of_speech ?? undefined}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title="Word content" />
          <CardBody>
            <WordFields word={word} />
          </CardBody>
        </Card>

        <div className="grid gap-5">
          <Card>
            <CardHeader title="Your progress" />
            <CardBody className="space-y-4">
              {progress ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Status</span>
                    <FamiliarityBadge level={progress.familiarity_level} />
                  </div>
                  <Metric label="Correct" value={progress.correct_count} />
                  <Metric label="Wrong" value={progress.wrong_count} />
                  <Metric label="Interval" value={`${progress.review_interval} days`} />
                  <Metric
                    label="Next review"
                    value={new Date(progress.next_review_at).toLocaleString("zh-TW")}
                  />
                </>
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  This word has no progress row yet. Initialize progress from Dashboard to include it in Review.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Notes" />
            <CardBody>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {progress?.notes?.trim() || "No personal notes yet."}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-950">{value}</span>
    </div>
  );
}
