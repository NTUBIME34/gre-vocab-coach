# GRE Vocab Coach

GRE Vocab Coach 是一個雲端化 GRE 單字複習工具 MVP，使用 Next.js、Supabase、Vercel 和 spaced repetition 設計。目標是把既有 GRE 單字書整理成可長期複習、跨裝置使用的學習工具。

目前已完成：

- Supabase schema
- seed data
- reusable components
- Dashboard
- Review flashcards
- Vocabulary List
- Word Detail
- Mistakes
- Stats
- core spaced repetition utility functions
- Supabase setup guide
- Vercel deployment guide

## Tech Stack

| Layer | Tool |
| --- | --- |
| Frontend | Next.js App Router + TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Hosting | Vercel |
| CSV parsing, future | Papa Parse |
| Validation, future | Zod |

## Project Structure

```text
gre-vocab-coach/
  data/
    sample-vocabulary.csv
  docs/
    DATABASE_DESIGN.md
    ENVIRONMENT.md
    PHASE_2.md
    PROJECT_STRUCTURE.md
    SEED_DATA.md
    SUPABASE_SETUP.md
    VERCEL_DEPLOY.md
  supabase/
    schema.sql
    seed.sql
    seed_user_progress.sql
  src/
    app/
      dashboard/page.tsx
      mistakes/page.tsx
      review/actions.ts
      review/page.tsx
      stats/page.tsx
      words/page.tsx
      words/[id]/page.tsx
    components/
    lib/
      data.ts
      srs.ts
      supabase/
    types/
      database.ts
```

## First-Time Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create Supabase project

Follow the full guide:

```text
docs/SUPABASE_SETUP.md
```

Short version:

1. Create a Supabase project.
2. Copy project URL and anon key.
3. Run `supabase/schema.sql` in Supabase SQL Editor.
4. Run `supabase/seed.sql`.
5. Create a test Auth user.
6. Replace the placeholder user id in `supabase/seed_user_progress.sql`.
7. Run `supabase/seed_user_progress.sql`.

### 3. Configure local environment

```bash
cp .env.example .env.local
```

Fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=GRE Vocab Coach
```

### 4. Run locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Main routes:

- `/dashboard`
- `/review`
- `/words`
- `/mistakes`
- `/stats`

## Seed Data

Seed files:

| File | Purpose |
| --- | --- |
| `supabase/seed.sql` | Inserts 10 shared GRE vocabulary rows |
| `supabase/seed_mason_combined.sql` | Inserts/updates the deduplicated Mason 1000 + Mason 2000 vocabulary |
| `supabase/seed_user_progress.sql` | Creates progress rows for a specific Auth user |
| `data/sample-vocabulary.csv` | Sample CSV for future import feature |
| `data/mason-combined-vocabulary.csv` | Deduplicated Mason vocabulary CSV |

Detailed guide:

```text
docs/SEED_DATA.md
```

Mason import guide:

```text
docs/MASON_IMPORT.md
```

## Environment Variables

See:

```text
docs/ENVIRONMENT.md
```

Required for local development:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=GRE Vocab Coach
```

Optional for later:

```bash
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in client components.

## Deployment

Deploy to Vercel using:

```text
docs/VERCEL_DEPLOY.md
```

The important deployment steps are:

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Add Supabase environment variables.
4. Deploy.
5. Update Supabase Auth Site URL and Redirect URLs.

## Spaced Repetition

Core file:

```text
src/lib/srs.ts
```

Current MVP rules:

| Rating | Next Review | Count Update |
| --- | --- | --- |
| again | 10 minutes | `wrong_count + 1` |
| hard | 1 day | `wrong_count + 1` |
| good | 3 days or interval x 2 | `correct_count + 1` |
| easy | 7 days or interval x 3 | `correct_count + 1` |

When interval reaches 30 days, the word is marked mastered.

## Current Limitations

This project is still an MVP. Phase 2 basics are now implemented:

- `/login`
- CSV import route
- notes editing form
- daily new-word queue
- PWA manifest
- dark mode
- CSV export
- SRS and CSV parser tests

See:

```text
docs/PHASE_2.md
```

## Useful Commands

```bash
npm run dev
npm run typecheck
npm run build
npm run test
```

## Suggested Next Step

Suggested next improvements:

1. Google Login
2. CSV import preview
3. richer stats charts
4. offline cache for today's review queue
