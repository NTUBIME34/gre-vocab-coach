import { ButtonLink } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
      {actionHref && actionLabel ? (
        <ButtonLink href={actionHref} className="mt-5">
          {actionLabel}
        </ButtonLink>
      ) : null}
    </div>
  );
}
