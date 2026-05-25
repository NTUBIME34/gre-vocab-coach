import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function escapeCsv(value: unknown) {
  const text = Array.isArray(value) ? value.join(";") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("vocabulary").select("*").order("word", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
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
