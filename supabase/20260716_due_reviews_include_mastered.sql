-- Mastered words must keep resurfacing on their long intervals instead of
-- being permanently retired: spaced repetition never graduates a card, it
-- just sees it less often (30d, 60d, ... as "good" ratings keep doubling it).
--
-- The app itself no longer reads v_due_reviews (it queries user_progress
-- directly), so this migration only keeps the view consistent for anyone
-- querying it from the SQL editor. Safe to run any time, idempotent.

create or replace view public.v_due_reviews
with (security_invoker = true)
as
select
  up.user_id,
  up.word_id,
  v.word,
  v.part_of_speech,
  v.chinese_meaning,
  v.english_definition,
  v.example_sentence,
  v.synonyms,
  v.antonyms,
  v.memory_hint,
  v.difficulty_level,
  v.frequency_level,
  v.source_book_chapter,
  up.familiarity_level,
  up.correct_count,
  up.wrong_count,
  up.last_reviewed_at,
  up.next_review_at,
  up.review_interval,
  up.is_starred,
  up.is_mastered,
  up.notes
from public.user_progress up
join public.vocabulary v on v.id = up.word_id
where up.next_review_at <= now();
