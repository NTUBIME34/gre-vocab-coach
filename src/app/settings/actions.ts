"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function updateSettingsAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const dailyNewWords = Number(formData.get("daily_new_words") ?? 20);
  const dailyReviewLimit = Number(formData.get("daily_review_limit") ?? 100);
  const darkMode = formData.get("dark_mode") === "on";

  const { error } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    daily_new_words: Math.min(Math.max(dailyNewWords, 0), 200),
    daily_review_limit: Math.min(Math.max(dailyReviewLimit, 1), 500),
    dark_mode: darkMode
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/", "layout");
  redirect("/settings");
}
