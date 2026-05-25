import Link from "next/link";
import { FamiliarityBadge } from "@/components/familiarity-badge";
import type { ProgressWithWord, VocabularyRow } from "@/lib/data";

export function VocabularyTable({ words }: { words: VocabularyRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Word</th>
            <th className="px-4 py-3 font-medium">Meaning</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">POS</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {words.map((word) => (
            <tr key={word.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-950">
                <Link href={`/vocabulary/${word.id}`}>{word.word}</Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{word.chinese_meaning}</td>
              <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">{word.part_of_speech ?? "-"}</td>
              <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                {word.source_book_chapter ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MistakeTable({ rows }: { rows: ProgressWithWord[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Word</th>
            <th className="px-4 py-3 font-medium">Wrong</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Status</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Next review</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.word_id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link href={`/vocabulary/${row.word_id}`} className="font-medium text-slate-950">
                  {row.vocabulary?.word ?? row.word_id}
                </Link>
                <p className="mt-1 text-slate-500">{row.vocabulary?.chinese_meaning ?? ""}</p>
              </td>
              <td className="px-4 py-3 text-slate-700">{row.wrong_count}</td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <FamiliarityBadge level={row.familiarity_level} />
              </td>
              <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                {new Date(row.next_review_at).toLocaleDateString("zh-TW")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
