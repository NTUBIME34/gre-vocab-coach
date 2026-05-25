# Database Design

## `vocabulary`

Stores the shared GRE vocabulary content imported from the user's source book.

| Column | Purpose | MVP |
| --- | --- | --- |
| `id` | Stable word id | Required |
| `word` | English headword | Required |
| `normalized_word` | Lowercase trimmed generated value for dedupe/search | Required |
| `part_of_speech` | Verb, noun, adjective, etc. | Recommended |
| `chinese_meaning` | Chinese meaning for fast recall | Required |
| `english_definition` | English explanation to avoid translation drift | Recommended |
| `example_sentence` | GRE-style usage context | Recommended |
| `synonyms` | Synonym recognition for GRE verbal | Recommended |
| `antonyms` | Contrastive meaning | Optional |
| `memory_hint` | Mnemonic or personal clue | Optional |
| `difficulty_level` | 1-5 subjective difficulty | Optional |
| `frequency_level` | 1-5 GRE frequency | Optional |
| `source_book_chapter` | Source tracking from Mason 1000/2000 or chapter | Recommended |

## `user_progress`

Stores each user's state for each word.

| Column | Purpose | MVP |
| --- | --- | --- |
| `user_id` | Owner of the progress row | Required |
| `word_id` | Vocabulary row | Required |
| `familiarity_level` | 0 new, 1 again, 2 hard, 3 good, 4 easy, 5 mastered | Required |
| `correct_count` | Number of Good/Easy answers | Required |
| `wrong_count` | Number of Again/Hard answers | Required |
| `last_reviewed_at` | Most recent review time | Required |
| `next_review_at` | Scheduling key for daily review | Required |
| `review_interval` | Current interval in days | Required |
| `is_starred` | User bookmark | Optional |
| `is_mastered` | Mature card flag when interval reaches threshold | Required |
| `notes` | User's private notes | Recommended |

## `review_logs`

Append-only history for analytics, debugging, and future AI recommendations.

| Column | Purpose | MVP |
| --- | --- | --- |
| `id` | Log row id | Required |
| `user_id` | Owner of log | Required |
| `word_id` | Reviewed word | Required |
| `review_time` | Review timestamp | Required |
| `review_mode` | Flashcard or future quiz modes | Required |
| `answer_result` | Again, Hard, Good, Easy | Required |
| `response_time` | Milliseconds to answer | Optional |
| `confidence_level` | User self-confidence 1-5 | Optional |

## `user_settings`

Small per-user preferences for daily workload and display.

| Column | Purpose | MVP |
| --- | --- | --- |
| `daily_new_words` | Target number of unseen words per day | Required |
| `daily_review_limit` | Maximum due review cards per day | Required |
| `dark_mode` | User theme preference | Optional |

## Query Patterns

- Today's review queue: `user_progress.user_id = auth.uid()` and `next_review_at <= now()`.
- Mistake book: `wrong_count > 0`, ordered by `wrong_count desc`.
- Word search: `normalized_word`, `chinese_meaning`, and array fields such as `synonyms`.
- Dashboard counts: due count, mastered count, mistake count, and completed reviews today.
