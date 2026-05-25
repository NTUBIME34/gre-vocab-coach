import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ReviewSession } from "@/components/review-session";
import { requireUser } from "@/lib/auth";
import { getDueReviewItems } from "@/lib/data";

export default async function ReviewPage() {
  const user = await requireUser();
  const items = await getDueReviewItems(user.id);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Flashcards"
        title="Today&apos;s Review"
        description="Flip each card, then choose the rating that best matches your recall."
      />
      <ReviewSession items={items} />
    </AppShell>
  );
}
