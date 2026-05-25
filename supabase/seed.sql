-- GRE Vocab Coach seed vocabulary
-- Run after supabase/schema.sql.
-- This file inserts shared vocabulary only. User progress is seeded separately
-- because user ids are created by Supabase Auth.

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
values
  (
    'abate',
    'verb',
    '減少；緩和',
    'to become less intense or widespread',
    'The public anger did not abate after the official apology.',
    array['subside', 'diminish', 'wane'],
    array['intensify', 'increase'],
    'a + bate: intensity seems beaten down',
    3,
    4,
    'Sample Chapter 1'
  ),
  (
    'aberrant',
    'adjective',
    '異常的；偏離常軌的',
    'departing from an accepted standard',
    'The scientist treated the aberrant data point as a clue rather than an error.',
    array['deviant', 'anomalous', 'atypical'],
    array['normal', 'typical'],
    'aberrant behavior is behavior that errs from the norm',
    4,
    4,
    'Sample Chapter 1'
  ),
  (
    'laconic',
    'adjective',
    '簡潔的；寡言的',
    'using very few words',
    'Her laconic reply made the committee suspect she knew more than she said.',
    array['terse', 'succinct', 'concise'],
    array['verbose', 'loquacious'],
    'laconic sounds like lack: a lack of words',
    3,
    5,
    'Sample Chapter 1'
  ),
  (
    'obdurate',
    'adjective',
    '固執的；頑固的',
    'stubbornly refusing to change one''s opinion or course of action',
    'Even overwhelming evidence failed to persuade the obdurate official.',
    array['stubborn', 'intransigent', 'unyielding'],
    array['pliant', 'flexible'],
    'hard and durable opinions',
    4,
    4,
    'Sample Chapter 1'
  ),
  (
    'prosaic',
    'adjective',
    '平凡的；缺乏想像力的',
    'commonplace or unimaginative',
    'The critic found the novel technically competent but disappointingly prosaic.',
    array['ordinary', 'mundane', 'banal'],
    array['imaginative', 'inspired'],
    'prose can feel plain compared with poetry',
    3,
    4,
    'Sample Chapter 1'
  ),
  (
    'equivocal',
    'adjective',
    '模稜兩可的；含糊的',
    'open to more than one interpretation',
    'The candidate gave an equivocal answer to avoid alienating either side.',
    array['ambiguous', 'vague', 'ambivalent'],
    array['clear', 'unequivocal'],
    'equal voices pulling meaning in two directions',
    4,
    5,
    'Sample Chapter 2'
  ),
  (
    'fastidious',
    'adjective',
    '挑剔的；一絲不苟的',
    'very attentive to detail and hard to please',
    'The fastidious editor noticed inconsistencies that everyone else ignored.',
    array['meticulous', 'scrupulous', 'exacting'],
    array['careless', 'sloppy'],
    'fastidious people are fussy about details',
    4,
    4,
    'Sample Chapter 2'
  ),
  (
    'inchoate',
    'adjective',
    '剛開始的；未成形的',
    'just begun and not fully formed',
    'The proposal was promising but still inchoate.',
    array['incipient', 'rudimentary', 'nascent'],
    array['developed', 'mature'],
    'inchoate ideas are incomplete',
    5,
    3,
    'Sample Chapter 2'
  ),
  (
    'mollify',
    'verb',
    '安撫；緩和',
    'to soothe anger or anxiety',
    'The revised policy did little to mollify the protesters.',
    array['appease', 'pacify', 'placate'],
    array['provoke', 'agitate'],
    'make someone more mellow',
    3,
    4,
    'Sample Chapter 2'
  ),
  (
    'recalcitrant',
    'adjective',
    '不服從的；頑抗的',
    'having an obstinately uncooperative attitude',
    'The recalcitrant witness refused to answer even simple questions.',
    array['defiant', 'unruly', 'obstinate'],
    array['compliant', 'obedient'],
    're-calcitrant kicks back against control',
    5,
    4,
    'Sample Chapter 2'
  )
on conflict (normalized_word, coalesce(part_of_speech, ''))
do update set
  chinese_meaning = excluded.chinese_meaning,
  english_definition = excluded.english_definition,
  example_sentence = excluded.example_sentence,
  synonyms = excluded.synonyms,
  antonyms = excluded.antonyms,
  memory_hint = excluded.memory_hint,
  difficulty_level = excluded.difficulty_level,
  frequency_level = excluded.frequency_level,
  source_book_chapter = excluded.source_book_chapter;
