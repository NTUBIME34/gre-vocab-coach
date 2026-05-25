# Mason Vocabulary Import

This project now includes a deduplicated Mason vocabulary import built from:

- `data/mason1000-vocabulary.csv`
- `data/mason2000-vocabulary.csv`

Generated files:

- `data/mason-combined-vocabulary.csv`
- `supabase/seed_mason_combined.sql`

## Deduplication Rule

The merge key is:

```text
lower(trim(word))
```

That means the same English word is stored only once, even if it appears in both Mason 1000 and Mason 2000.

Current merge result:

| Source | Rows |
| --- | ---: |
| Mason 1000 | 1077 |
| Mason 2000 | 2053 |
| Combined unique words | 2054 |
| Duplicates removed | 1076 |

## Merge Priority

When the same word appears in both files:

1. Mason 1000 content is kept as the primary row.
2. Missing fields can be filled from Mason 2000.
3. Synonyms and antonyms are combined and deduplicated.
4. `difficulty_level` and `frequency_level` use the higher value.
5. `source_book_chapter` records both source books when applicable.

## How To Import Into Supabase

1. Open Supabase.
2. Go to your project.
3. Open `SQL Editor`.
4. Open this local project file:

```text
supabase/seed_mason_combined.sql
```

5. Copy the full SQL.
6. Paste it into Supabase SQL Editor.
7. Click `Run`.

The SQL does two things:

1. Updates existing words that match by `lower(trim(word))`.
2. Inserts only words that do not already exist.

It does not create duplicate rows for the same word.

## After Importing

If your user already initialized progress before importing Mason data, new words will not automatically appear in `user_progress`.

Go to the app Dashboard and click:

```text
初始化我的單字進度
```

The initialization action only inserts missing progress rows, so it is safe to click again.

## Files To Commit

Keep all three CSV files for traceability:

- `data/mason1000-vocabulary.csv`
- `data/mason2000-vocabulary.csv`
- `data/mason-combined-vocabulary.csv`

Use this SQL for Supabase:

- `supabase/seed_mason_combined.sql`
