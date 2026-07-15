import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "bg-slate-950 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200",
  secondary:
    "bg-white text-slate-950 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800",
  subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
  danger: "bg-rose-600 text-white hover:bg-rose-700"
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  className = ""
}: {
  children: ReactNode;
  href: string;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
