# Project Structure

```text
gre-vocab-coach/
  supabase/
    schema.sql
  docs/
    DATABASE_DESIGN.md
    PROJECT_STRUCTURE.md
    ENVIRONMENT.md
  src/
    app/
      layout.tsx
      page.tsx
      globals.css
    lib/
      srs.ts
      supabase/
        client.ts
        server.ts
    types/
      database.ts
  .env.example
  package.json
  tsconfig.json
```

## Step 1: Project Architecture

Use Next.js App Router with TypeScript. Keep product logic in `src/lib`, schema types in `src/types`, and Supabase SQL in `supabase/schema.sql`.

UI pages will be added later:

```text
src/app/login
src/app/dashboard
src/app/review
src/app/words
src/app/words/[id]
src/app/mistakes
src/app/settings
```

## Step 2: Supabase SQL Schema

Run `supabase/schema.sql` in the Supabase SQL editor. It creates:

- `vocabulary`
- `user_progress`
- `review_logs`
- `user_settings`
- indexes
- updated-at triggers
- RLS policies
- `v_due_reviews` view

## Step 3: Environment Variables

Copy `.env.example` to `.env.local` and fill the Supabase values.

## Step 4: Supabase Client Helpers

- `src/lib/supabase/client.ts` is for browser components.
- `src/lib/supabase/server.ts` is for server components, route handlers, and server actions.

## Step 5: Spaced Repetition Utility

`src/lib/srs.ts` exposes pure functions for:

- calculating the next interval
- updating familiarity level
- updating correct/wrong counts
- marking cards mastered when interval reaches 30 days
- building a progress update payload

Keep this logic pure so it is easy to test and reuse in API routes.
