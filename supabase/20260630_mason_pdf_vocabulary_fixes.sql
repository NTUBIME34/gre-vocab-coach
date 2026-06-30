-- Fix Mason PDF extraction misses and split merged entries.
-- Safe to run multiple times: existing words are updated, missing words are inserted once.

begin;

create temp table tmp_mason_pdf_vocab_fixes (
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

insert into tmp_mason_pdf_vocab_fixes (
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
    'astute',
    'adj.',
    '敏銳的、精明的',
    'clever and quick at seeing how to gain an advantage; shrewd',
    'an astute observer',
    array['canny', 'savvy', 'sharp', 'sharp-witted', 'shrewd', 'smart']::text[],
    '{}'::text[],
    '形近 acute (敏銳的、機敏的)',
    4,
    4,
    'Mason 1000; Mason 2000 / primary: Mason 1000 PDF page 18'
  ),
  (
    'ascetic',
    'adj.',
    '禁慾主義者、苦行者',
    'not allowing oneself pleasures and comforts; having or involving a very austere life',
    'Calley is downright ascetic, a man who disdains Hollywood profligacy (揮霍；浪費).',
    '{}'::text[],
    '{}'::text[],
    null,
    4,
    4,
    'Mason 1000; Mason 2000 / primary: Mason 1000 PDF page 32'
  ),
  (
    'at odds',
    null,
    '不同於、不一致；對立的；意見不同的',
    'In disagreement, opposed',
    'Even Republicans at odds with Trump''s climate posture, poll finds. - The Guardians',
    '{}'::text[],
    '{}'::text[],
    null,
    4,
    4,
    'Mason 1000; Mason 2000 / primary: Mason 1000 PDF page 32'
  ),
  (
    'lax',
    'adj.',
    '鬆散的、不嚴格的',
    'not sufficiently strict or severe; negligent',
    'Facebook''s lax data-privacy rules',
    array['careless', 'derelict', 'disregardful', 'neglecting', 'negligent', 'remiss', 'slack']::text[],
    '{}'::text[],
    null,
    3,
    3,
    'Mason 1000; Mason 2000 / primary: Mason 1000 PDF page 52'
  ),
  (
    'lay out',
    null,
    '花錢',
    null,
    'They had already laid out a substantial sum for the wedding. 為婚禮花費了很多錢 We''ll need to lay out a lot of money to buy all the materials for the project. 花很多錢買材料',
    '{}'::text[],
    '{}'::text[],
    null,
    3,
    3,
    'Mason 1000; Mason 2000 / primary: Mason 1000 PDF page 52'
  ),
  (
    'buoyant',
    'adj.',
    '能浮起的、看漲的、繁榮的',
    '(of an object) able to float',
    'Italian assets remained buoyant after voters rejected changes backed by the government in a 2016 constitutional referendum. 義大利資產保持上漲在選民拒絕了2016年政府支持的憲法公投',
    '{}'::text[],
    '{}'::text[],
    null,
    5,
    5,
    'Mason 1000; Mason 2000 / primary: Mason 1000 PDF page 14'
  ),
  (
    'burgeoning',
    null,
    '迅速發展的、生機蓬勃的',
    null,
    null,
    '{}'::text[],
    '{}'::text[],
    null,
    1,
    1,
    'Mason 2000 / Mason 2000 PDF page 102 / 字根 vulg 普通 / 提示 vulgar 粗俗的、下流的'
  ),
  (
    'quixotic',
    'adj.',
    '不切實際的、空想的',
    'noble, unselfish or gallant in an extravagant or impractical way',
    'Mumey had announced his candidacy in the election. It seemed a quixotic adventure, given Mumey''s lack of name recognition outside the town. 這似乎是個唐吉軻德式的空想的冒險，因為在城鎮外沒人認得他的名字',
    array['impractical', 'visionary', 'chimerical']::text[],
    '{}'::text[],
    '源自Don Quixote(唐吉訶德)',
    4,
    4,
    'Mason 1000; Mason 2000 / primary: Mason 1000 PDF page 20'
  ),
  (
    'rail at',
    null,
    '抱怨',
    null,
    null,
    '{}'::text[],
    '{}'::text[],
    null,
    1,
    1,
    'Mason 2000 / Mason 2000 PDF page 118 / 字根 vulg 普通 / 提示 vulgar 粗俗的、下流的'
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
from tmp_mason_pdf_vocab_fixes t
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
from tmp_mason_pdf_vocab_fixes t
where not exists (
  select 1
  from public.vocabulary v
  where lower(trim(v.word)) = lower(trim(t.word))
);

commit;
