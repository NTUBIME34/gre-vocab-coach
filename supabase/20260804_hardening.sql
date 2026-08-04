-- Hardening pass. Safe to run any time; every statement is idempotent.

-- 1. New accounts should land in dark mode, matching what the app writes for
--    every new settings row (src/lib/data.ts) and what AppShell falls back to.
--    The old `false` default only ever showed up as a brief light flash before
--    the app wrote its own row.
alter table public.user_settings alter column dark_mode set default true;

-- 2. Deleting a review row was impossible: user_progress and review_logs had
--    select/insert/update policies but no delete policy, so "reset my progress"
--    or "clear my history" could not be built at all. Scoped to the owner.
drop policy if exists "Users can delete own progress" on public.user_progress;
create policy "Users can delete own progress"
on public.user_progress for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can delete own review logs" on public.review_logs;
create policy "Users can delete own review logs"
on public.review_logs for delete
to authenticated
using (auth.uid() = user_id);

-- 3. The mistakes list and the stats page both scan progress rows ordered by
--    wrong_count for one user; the existing partial index covers that, but the
--    review queue's "oldest due first" scan had no matching order.
create index if not exists user_progress_due_order_idx
on public.user_progress (user_id, next_review_at asc);
