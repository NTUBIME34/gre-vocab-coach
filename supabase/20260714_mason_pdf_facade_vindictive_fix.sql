-- Fix two Mason 2000 PDF words whose text got swallowed into the previous
-- word's row because of an overlapping text-box layout in the source PDF:
--   - "façade" (page 28) was concatenated into "efface"'s chinese_meaning /
--     english_definition.
--   - "vindictive" (page 92) was concatenated into "vindicate"'s fields in
--     the Mason-2000-only extraction (the live combined table already used
--     the clean Mason 1000 version of "vindicate", so only "efface" needs
--     correcting here; "vindictive" itself was simply missing).
-- Safe to run multiple times: existing words are updated, missing words are inserted once.

begin;

create temp table tmp_mason_pdf_vocab_facade_vindictive (
  word text not null,
  part_of_speech text,
  chinese_meaning text not null,
  english_definition text,
  example_sentence text,
  synonyms text[],
  antonyms text[],
  memory_hint text,
  difficulty_level int,
  frequency_level int,
  source_book_chapter text
) on commit drop;

insert into tmp_mason_pdf_vocab_facade_vindictive (
  word,
  part_of_speech,
  chinese_meaning,
  english_definition,
  example_sentence,
  synonyms,
  antonyms,
  memory_hint,
  difficulty_level,
  frequency_level,
  source_book_chapter
) values
  (
    'efface',
    'v.',
    '擦掉、抹去',
    'rub or wipe (sth) out; cause to fade',
    null,
    '{}'::text[],
    '{}'::text[],
    null,
    1,
    1,
    'Mason 2000 / Mason 2000 PDF page 28 / 字根 face 臉、面 / 提示 preface 序言、緒言'
  ),
  (
    'façade',
    'n.',
    '建築物的正面、（虛偽的）外表',
    'the front of a building, esp an imposing or attractive one; an outward appearance maintained to conceal a less pleasant reality',
    null,
    '{}'::text[],
    '{}'::text[],
    null,
    1,
    1,
    'Mason 2000 / Mason 2000 PDF page 28 / 字根 face 臉、面 / 提示 preface 序言、緒言'
  ),
  (
    'vindictive',
    'adj.',
    '有復仇心的、報復的',
    'having or showing a desire for revenge; unforgiving',
    null,
    '{}'::text[],
    '{}'::text[],
    null,
    1,
    1,
    'Mason 2000 / Mason 2000 PDF page 92 / 字根 vend, vind 復仇 / 提示 vindicate 為…平反、證明…正確'
  );

update public.vocabulary v
set
  part_of_speech = t.part_of_speech,
  chinese_meaning = t.chinese_meaning,
  english_definition = t.english_definition,
  example_sentence = t.example_sentence,
  synonyms = coalesce(t.synonyms, '{}'::text[]),
  antonyms = coalesce(t.antonyms, '{}'::text[]),
  memory_hint = t.memory_hint,
  difficulty_level = t.difficulty_level,
  frequency_level = t.frequency_level,
  source_book_chapter = t.source_book_chapter
from tmp_mason_pdf_vocab_facade_vindictive t
where lower(trim(v.word)) = lower(trim(t.word));

insert into public.vocabulary (
  word,
  part_of_speech,
  chinese_meaning,
  english_definition,
  example_sentence,
  synonyms,
  antonyms,
  memory_hint,
  difficulty_level,
  frequency_level,
  source_book_chapter
)
select
  t.word,
  t.part_of_speech,
  t.chinese_meaning,
  t.english_definition,
  t.example_sentence,
  coalesce(t.synonyms, '{}'::text[]),
  coalesce(t.antonyms, '{}'::text[]),
  t.memory_hint,
  t.difficulty_level,
  t.frequency_level,
  t.source_book_chapter
from tmp_mason_pdf_vocab_facade_vindictive t
where not exists (
  select 1
  from public.vocabulary v
  where lower(trim(v.word)) = lower(trim(t.word))
);

commit;
