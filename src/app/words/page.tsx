import { redirect } from "next/navigation";

export default async function WordsPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q ? `?q=${encodeURIComponent(resolvedSearchParams.q)}` : "";
  redirect(`/vocabulary${query}`);
}
