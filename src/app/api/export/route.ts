import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";
import { fetchAllPages } from "@/lib/supabase/paginate";
import { createClient } from "@/lib/supabase/server";

// Excel and Sheets execute a cell that opens with = + - @, so a crafted word or
// meaning could run a formula on whoever opens the export. Prefixing a single
// quote neutralizes it while still displaying the original text.
const FORMULA_TRIGGERS = /^[=+\-@\t\r]/;

function escapeCsv(value: unknown) {
  const text = Array.isArray(value) ? value.join(";") : String(value ?? "");
  const guarded = FORMULA_TRIGGERS.test(text) ? `'${text}` : text;
  return `"${guarded.replaceAll('"', '""')}"`;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Please sign in before exporting." }, { status: 401 });
  }

  // Admin-only, matching import. Signup is open, and this endpoint hands back the
  // entire word bank -- including the Mason book content the repo deliberately
  // keeps out of version control for copyright reasons.
  if (!isAdminUser(user.id)) {
    return NextResponse.json({ ok: false, message: "This account cannot export vocabulary." }, { status: 403 });
  }


  let data: Record<string, unknown>[];
  try {
    data = await fetchAllPages<Record<string, unknown>>((from, to) =>
      supabase.from("vocabulary").select("*").order("word", { ascending: true }).range(from, to)
    );
  } catch (error) {
    console.error("[api:export]", error);
    return NextResponse.json({ ok: false, message: "Could not export the vocabulary bank." }, { status: 500 });
  }

  const headers = [
    "word",
    "part_of_speech",
    "chinese_meaning",
    "english_definition",
    "example_sentence",
    "synonyms",
    "antonyms",
    "memory_hint",
    "difficulty_level",
    "frequency_level",
    "source_book_chapter"
  ];

  const csv = [
    headers.join(","),
    ...(data ?? []).map((row) => headers.map((header) => escapeCsv(row[header])).join(","))
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gre-vocabulary-export.csv"'
    }
  });
}
