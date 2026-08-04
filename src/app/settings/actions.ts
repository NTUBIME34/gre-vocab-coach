"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { safeErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

// Number("abc") is NaN, which slid straight through the old Math.min/Math.max
// clamps and hit a NOT NULL column as a 500. Coercion + catch keeps a garbled
// form value from ever reaching the database.
const settingsSchema = z.object({
  daily_new_words: z.coerce.number().int().min(0).max(200).catch(20),
  daily_review_limit: z.coerce.number().int().min(1).max(500).catch(100),
  dark_mode: z.boolean()
});

export async function updateSettingsAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const settings = settingsSchema.parse({
    daily_new_words: formData.get("daily_new_words") ?? 20,
    daily_review_limit: formData.get("daily_review_limit") ?? 100,
    dark_mode: formData.get("dark_mode") === "on"
  });

  const { error } = await supabase.from("user_settings").upsert({ user_id: user.id, ...settings });

  if (error) {
    throw new Error(safeErrorMessage("updateSettings", error));
  }

  revalidatePath("/", "layout");
  redirect("/settings");
}
