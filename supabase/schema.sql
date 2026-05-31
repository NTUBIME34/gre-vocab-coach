-- GRE Vocab Coach MVP schema
-- Run this file in the Supabase SQL editor.

create extension if not exists pgcrypto;

create type public.review_rating as enum ('again', 'hard', 'good', 'easy');
create type public.review_mode as enum (
  'flashcard',
  'en_to_zh',
  'zh_to_en',
  'mistake_review',
  'practice_definition',
  'practice_chinese',
  'practice_cloze'
);

create table public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  normalized_word text generated always as (lower(trim(word))) stored,
  part_of_speech text,
  chinese_meaning text not null,
  english_definition text,
  example_sentence text,
  synonyms text[] default '{}',
  antonyms text[] default '{}',
  memory_hint text,
  difficulty_level int default 3 check (difficulty_level between 1 and 5),
  frequency_level int default 3 check (frequency_level between 1 and 5),
  source_book_chapter text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_new_words int not null default 20 check (daily_new_words between 0 and 200),
  daily_review_limit int not null default 100 check (daily_review_limit between 1 and 500),
  dark_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.vocabulary(id) on delete cascade,
  familiarity_level int not null default 0 check (familiarity_level between 0 and 5),
  correct_count int not null default 0 check (correct_count >= 0),
  wrong_count int not null default 0 check (wrong_count >= 0),
  last_reviewed_at timestamptz,
  next_review_at timestamptz not null default now(),
  review_interval int not null default 0 check (review_interval >= 0),
  is_starred boolean not null default false,
  is_mastered boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, word_id)
);

create table public.review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.vocabulary(id) on delete cascade,
  review_time timestamptz not null default now(),
  review_mode public.review_mode not null default 'flashcard',
  answer_result public.review_rating not null,
  response_time int check (response_time is null or response_time >= 0),
  confidence_level int check (confidence_level is null or confidence_level between 1 and 5)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vocabulary_set_updated_at
before update on public.vocabulary
for each row execute function public.set_updated_at();

create trigger user_progress_set_updated_at
before update on public.user_progress
for each row execute function public.set_updated_at();

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create index vocabulary_normalized_word_idx on public.vocabulary (normalized_word);
create unique index vocabulary_word_pos_unique_idx
on public.vocabulary (normalized_word, coalesce(part_of_speech, ''));
create index vocabulary_chinese_meaning_idx on public.vocabulary using gin (to_tsvector('simple', chinese_meaning));
create index vocabulary_synonyms_idx on public.vocabulary using gin (synonyms);
create index vocabulary_antonyms_idx on public.vocabulary using gin (antonyms);
create index user_progress_due_idx on public.user_progress (user_id, next_review_at);
create index user_progress_mistakes_idx on public.user_progress (user_id, wrong_count desc) where wrong_count > 0;
create index user_progress_mastered_idx on public.user_progress (user_id, is_mastered);
create index review_logs_user_time_idx on public.review_logs (user_id, review_time desc);
create index review_logs_word_idx on public.review_logs (word_id);

alter table public.vocabulary enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_progress enable row level security;
alter table public.review_logs enable row level security;

create policy "Authenticated users can read vocabulary"
on public.vocabulary for select
to authenticated
using (true);

-- Import is safest through a server route that uses the service role key.
-- For a personal MVP, this insert policy can be enabled temporarily if needed.
create policy "Authenticated users can insert vocabulary"
on public.vocabulary for insert
to authenticated
with check (true);

create policy "Users can read own settings"
on public.user_settings for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own settings"
on public.user_settings for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own settings"
on public.user_settings for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read own progress"
on public.user_progress for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own progress"
on public.user_progress for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own progress"
on public.user_progress for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read own review logs"
on public.review_logs for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own review logs"
on public.review_logs for insert
to authenticated
with check (auth.uid() = user_id);

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
where up.next_review_at <= now()
  and up.is_mastered = false;
