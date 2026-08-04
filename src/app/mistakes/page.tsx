import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";
import { MistakeTable } from "@/components/word-list-table";
import { requireUser } from "@/lib/auth";
import { getMistakeItems } from "@/lib/data";

export default async function MistakesPage({
  searchParams
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page ?? 1) || 1;
  const { rows, total, pageSize } = await getMistakeItems(user.id, page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(total, page * pageSize);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Weak spots"
        title="Mistakes"
        description="Words you have marked Again or Hard. Highest wrong counts appear first."
        action={<ButtonLink href="/review">Review now</ButtonLink>}
      />

      {rows.length ? (
        <>
          <div className="mb-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              {rangeStart}-{rangeEnd} of {total} words
            </span>
            <span>
              Page {page} of {totalPages}
            </span>
          </div>
          <MistakeTable rows={rows} />
          <div className="mt-5 flex items-center justify-between">
            {page > 1 ? (
              <ButtonLink href={`/mistakes?page=${page - 1}`} variant="secondary">
                Previous
              </ButtonLink>
            ) : (
              <span />
            )}
            {page < totalPages ? (
              <ButtonLink href={`/mistakes?page=${page + 1}`} variant="secondary">
                Next
              </ButtonLink>
            ) : (
              <span />
            )}
          </div>
        </>
      ) : (
        <EmptyState
          title="No mistakes yet"
          description="Once you review cards and mark Again or Hard, they will appear here."
          actionHref="/review"
          actionLabel="Start review"
        />
      )}
    </AppShell>
  );
}
