import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";
import { MistakeTable } from "@/components/word-list-table";
import { requireUser } from "@/lib/auth";
import { getMistakeItems } from "@/lib/data";

export default async function MistakesPage() {
  const user = await requireUser();
  const mistakes = await getMistakeItems(user.id);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Weak spots"
        title="Mistakes"
        description="Words you have marked Again or Hard. Highest wrong counts appear first."
        action={<ButtonLink href="/review">Review now</ButtonLink>}
      />

      {mistakes.length ? (
        <MistakeTable rows={mistakes} />
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
