import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Server Components cannot write cookies, so the refreshed access token that
// @supabase/ssr produces there is discarded (see the silent catch in
// lib/supabase/server.ts). Every request then had to refresh again, and once
// Supabase rotated the refresh token past its reuse window the session broke and
// the user was signed out mid-session. Middleware is the one place that can
// persist the rotated token, so the refresh happens here, once.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  // Touching the user is what triggers the refresh-and-persist cycle above.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Static assets never carry a session worth refreshing, and running on them
  // would add an auth round trip to every image request.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"]
};
