import { redirect } from "next/navigation";

export default async function WordDetailRedirectPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/vocabulary/${id}`);
}
