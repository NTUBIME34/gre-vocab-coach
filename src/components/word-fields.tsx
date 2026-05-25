import type { VocabularyRow } from "@/lib/data";

function ArrayField({ label, items }: { label: string; items: string[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 text-sm text-slate-700">
            {item}
          </span>
        ))}
      </dd>
    </div>
  );
}

export function WordFields({ word }: { word: VocabularyRow }) {
  return (
    <dl className="grid gap-5">
      <div>
        <dt className="text-sm font-medium text-slate-500">Chinese meaning</dt>
        <dd className="mt-1 text-base leading-7 text-slate-950">{word.chinese_meaning}</dd>
      </div>
      {word.english_definition ? (
        <div>
          <dt className="text-sm font-medium text-slate-500">English definition</dt>
          <dd className="mt-1 text-base leading-7 text-slate-950">{word.english_definition}</dd>
        </div>
      ) : null}
      {word.example_sentence ? (
        <div>
          <dt className="text-sm font-medium text-slate-500">Example</dt>
          <dd className="mt-1 text-base leading-7 text-slate-950">{word.example_sentence}</dd>
        </div>
      ) : null}
      <ArrayField label="Synonyms" items={word.synonyms ?? []} />
      <ArrayField label="Antonyms" items={word.antonyms ?? []} />
      {word.memory_hint ? (
        <div>
          <dt className="text-sm font-medium text-slate-500">Memory hint</dt>
          <dd className="mt-1 text-base leading-7 text-slate-950">{word.memory_hint}</dd>
        </div>
      ) : null}
    </dl>
  );
}
