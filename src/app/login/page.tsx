import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getUser();

  if (user) {
    redirect("/");
  }

  return (
    // Renders outside AppShell (no user session, so no theme setting to read):
    // apply `dark` directly to match the logged-out default-dark theme.
    <main className="dark flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <AuthForm />
    </main>
  );
}
