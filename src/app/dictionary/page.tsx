import { AppShell } from "@/components/app-shell";
import { DictionaryShell } from "@/components/dictionary/dictionary-shell";
import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";

export default async function DictionaryPage() {
  await requireUser();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Lookup"
        title="Dictionary"
        description="Look up GRE words, meanings, examples, synonyms, antonyms, and notes from your Supabase vocabulary."
        action={
          <ButtonLink href="/vocabulary" variant="secondary">
            Browse vocabulary
          </ButtonLink>
        }
      />
      <DictionaryShell />
    </AppShell>
  );
}
