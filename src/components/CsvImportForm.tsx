"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

export function CsvImportForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/import", {
      method: "POST",
      body: formData
    });
    const result = await response.json();
    setIsSubmitting(false);

    if (!response.ok || !result.ok) {
      setMessage(result.message ?? "Import failed.");
      return;
    }

    setMessage(
      `Imported ${result.imported} new words. Skipped ${result.skippedDuplicates} duplicates. Created ${result.progressCreated} progress rows.`
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <input
        type="file"
        name="file"
        accept=".csv,text/csv"
        required
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Importing..." : "Import CSV"}
      </Button>
      {message ? <p className="whitespace-pre-wrap text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
