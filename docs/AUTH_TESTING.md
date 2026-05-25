# Auth Testing Guide

This app reads Supabase settings only from environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Do not hard-code Supabase keys in source files.

## Required `.env.local` location

The file must exist here:

```text
gre-vocab-coach/.env.local
```

Not in the parent folder.

## Local test flow

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Expected behavior:

1. `/` redirects to `/login` when signed out.
2. `/login` shows email/password login and sign-up.
3. After sign-up or login, the app redirects to `/`.
4. `/` redirects signed-in users to `/dashboard`.
5. Dashboard shows an initialize progress button if the account has no `user_progress`.
6. Click `初始化我的單字進度`.
7. Go to `/review`.
8. Flip a card.
9. Click Again, Hard, Good, or Easy.
10. Supabase `user_progress` and `review_logs` should update.

## Supabase dashboard checks

Authentication:

- Email provider enabled
- For local development, email confirmation can be disabled
- Site URL: `http://localhost:3000`
- Redirect URLs include `http://localhost:3000/**`

Database:

- `supabase/schema.sql` has been run
- `supabase/seed.sql` has been run
- `vocabulary` has rows
- RLS policies exist on `user_progress` and `review_logs`

## Troubleshooting

If every protected page redirects to `/login`, the browser does not have a Supabase session.

If login fails, check:

- Email provider is enabled
- The user exists under Supabase Authentication
- Password is correct
- Email confirmation setting matches your test plan

If Dashboard says there are no vocabulary rows:

- Run `supabase/seed.sql`
- Check `Table Editor` -> `vocabulary`

If Review has no cards:

- Click `初始化我的單字進度` from Dashboard
- Check `user_progress` has rows for your real Auth user id
- Check `next_review_at <= now()`
