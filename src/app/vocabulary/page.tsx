import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { VocabularyTable } from "@/components/word-list-table";
import { requireUser } from "@/lib/auth";
import { getVocabularyList } from "@/lib/data";

export default async function VocabularyPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  await requireUser();
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q ?? "";
  const words = await getVocabularyList(query);

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
          className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-slate-950 transition placeholder:text-slate-400 focus:ring-2"
        />
      </form>

      {words.length ? (
        <VocabularyTable words={words} />
      ) : (
        <EmptyState
          title="No vocabulary found"
          description="Import your GRE CSV first, or try a different search term."
        />
      )}
    </AppShell>
  );
}
