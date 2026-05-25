# Environment Variables

Create `.env.local` from `.env.example`.

| Variable | Required | Client Visible | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Browser-safe anon key, protected by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Only for admin imports | No | Server-only key that bypasses RLS |
| `NEXT_PUBLIC_APP_URL` | Yes | Yes | Local or deployed app URL |
| `NEXT_PUBLIC_APP_NAME` | No | Yes | Product display name |
| `OPENAI_API_KEY` | Future only | No | Reserved for AI features |

Never use `SUPABASE_SERVICE_ROLE_KEY` in client components.
