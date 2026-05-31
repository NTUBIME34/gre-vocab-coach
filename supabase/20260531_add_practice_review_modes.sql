-- Run this once in Supabase SQL Editor for existing projects.
alter type public.review_mode add value if not exists 'practice_definition';
alter type public.review_mode add value if not exists 'practice_chinese';
alter type public.review_mode add value if not exists 'practice_cloze';
