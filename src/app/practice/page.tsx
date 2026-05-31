import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PracticeShell } from "@/components/practice/practice-shell";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";

export default async function PracticePage() {
  await requireUser();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Drills"
        title="Practice"
        description="Multiple choice and cloze drills generated from your GRE vocabulary and progress."
        action={
          <ButtonLink href="/review" variant="secondary">
            Review cards
          </ButtonLink>
        }
      />
      <PracticeShell />
    </AppShell>
  );
}
