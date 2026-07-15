-- Remove the open "any authenticated user can insert vocabulary" policy.
-- CSV import (src/app/api/import/route.ts) now writes to `vocabulary` through a
-- server-only service-role client instead, so this policy is no longer needed and
-- was never meant to be permanent -- see its own comment in schema.sql:
--   "For a personal MVP, this insert policy can be enabled temporarily if needed."
-- With it removed, only the service role (which bypasses RLS entirely) can write
-- to the shared vocabulary table; regular authenticated sessions remain read-only.

drop policy if exists "Authenticated users can insert vocabulary" on public.vocabulary;
