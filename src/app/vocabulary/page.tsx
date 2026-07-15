import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";
import { VocabularyTable } from "@/components/word-list-table";
import { requireUser } from "@/lib/auth";
import { getVocabularyList } from "@/lib/data";

export default async function VocabularyPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  await requireUser();
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q ?? "";
  const page = Number(resolvedSearchParams?.page ?? 1) || 1;
  const { words, total, pageSize } = await getVocabularyList(query, page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(total, page * pageSize);

  function pageHref(target: number) {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    params.set("page", String(target));
    return `/vocabulary?${params.toString()}`;
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Vocabulary"
        title="Word List"
        description="Browse imported GRE words. Search supports word, Chinese meaning, and English definition."
      />

      <form className="mb-5">
        <label htmlFor="q" className="sr-only">
          Search words
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search word or meaning"
          className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-slate-950 transition placeholder:text-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-300 dark:placeholder:text-slate-500"
        />
      </form>

      {words.length ? (
        <>
          <div className="mb-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              {rangeStart}-{rangeEnd} of {total} words
            </span>
            <span>
              Page {page} of {totalPages}
            </span>
          </div>
          <VocabularyTable words={words} />
          <div className="mt-5 flex items-center justify-between">
            {page > 1 ? (
              <ButtonLink href={pageHref(page - 1)} variant="secondary">
                Previous
              </ButtonLink>
            ) : (
              <span />
            )}
            {page < totalPages ? (
              <ButtonLink href={pageHref(page + 1)} variant="secondary">
                Next
              </ButtonLink>
            ) : (
              <span />
            )}
          </div>
        </>
      ) : (
        <EmptyState
          title="No vocabulary found"
          description="Import your GRE CSV first, or try a different search term."
        />
      )}
    </AppShell>
  );
}
