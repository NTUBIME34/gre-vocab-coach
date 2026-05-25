import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { getUser } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/review", label: "Review" },
  { href: "/vocabulary", label: "Vocabulary" },
  { href: "/mistakes", label: "Mistakes" },
  { href: "/stats", label: "Stats" }
];

export async function AppShell({ children }: { children: ReactNode }) {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href={user ? "/dashboard" : "/login"} className="text-sm font-semibold">
            GRE Vocab Coach
          </Link>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            {user ? (
              <>
                <nav className="flex gap-1 overflow-x-auto text-sm">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 md:flex">
                  <span className="max-w-48 truncate text-sm text-slate-500">{user.email}</span>
                  <LogoutButton />
                </div>
                <div className="md:hidden">
                  <LogoutButton />
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
