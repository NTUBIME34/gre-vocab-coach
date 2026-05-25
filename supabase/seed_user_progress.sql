-- Optional user progress seed
-- Replace the value below with your Supabase Auth user id.
--
-- Where to find it:
-- Supabase Dashboard -> Authentication -> Users -> copy the user's UID.

with target_user as (
  select 'REPLACE_WITH_YOUR_AUTH_USER_ID'::uuid as user_id
)
insert into public.user_settings (user_id, daily_new_words, daily_review_limit, dark_mode)
select user_id, 20, 100, false
from target_user
on conflict (user_id) do nothing;

with target_user as (
  select 'REPLACE_WITH_YOUR_AUTH_USER_ID'::uuid as user_id
)
insert into public.user_progress (
  user_id,
  word_id,
  familiarity_level,
  correct_count,
  wrong_count,
  next_review_at,
  review_interval,
  is_mastered
)
select
  target_user.user_id,
  vocabulary.id,
  0,
  0,
  0,
  now(),
  0,
  false
from target_user
cross join public.vocabulary
on conflict (user_id, word_id) do nothing;
