import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// cache() dedupes within one request: AppShell and the page both call this,
// which previously meant two Supabase Auth round trips per page view.
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
});

export async function requireUser() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
