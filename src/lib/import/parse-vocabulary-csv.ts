import Papa from "papaparse";
import { z } from "zod";

export const vocabularyCsvRowSchema = z.object({
  word: z.string().trim().min(1),
  part_of_speech: z.string().optional().default(""),
  chinese_meaning: z.string().trim().min(1),
  english_definition: z.string().optional().default(""),
  example_sentence: z.string().optional().default(""),
  synonyms: z.string().optional().default(""),
  antonyms: z.string().optional().default(""),
  memory_hint: z.string().optional().default(""),
  difficulty_level: z.coerce.number().int().min(1).max(5).optional().default(3),
  frequency_level: z.coerce.number().int().min(1).max(5).optional().default(3),
  source_book_chapter: z.string().optional().default("")
});

export type ParsedVocabularyCsvRow = z.infer<typeof vocabularyCsvRowSchema>;

export function splitCsvList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .replaceAll("；", ";")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseVocabularyCsv(csvText: string) {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parsed.errors.length) {
    return {
      ok: false as const,
      rows: [],
      errors: parsed.errors.map((error) => `Row ${error.row ?? "unknown"}: ${error.message}`)
    };
  }

  const rows: ParsedVocabularyCsvRow[] = [];
  const errors: string[] = [];

  parsed.data.forEach((row, index) => {
    const result = vocabularyCsvRowSchema.safeParse(row);

    if (!result.success) {
      errors.push(`Row ${index + 2}: ${result.error.issues.map((issue) => issue.message).join(", ")}`);
      return;
    }

    rows.push(result.data);
  });

  if (errors.length) {
    return { ok: false as const, rows: [], errors };
  }

  return { ok: true as const, rows, errors: [] };
}
