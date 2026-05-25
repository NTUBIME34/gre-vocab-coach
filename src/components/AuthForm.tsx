"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function AuthForm() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("Please enter both email and password.");
      setIsSubmitting(false);
      return;
    }

    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password
      });

      setIsSubmitting(false);

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/");
      router.refresh();
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password
    });

    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setMessage("Sign up successful. Please check your email if confirmation is enabled.");
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">GRE Vocab Coach</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {mode === "login"
            ? "Continue your GRE vocabulary review."
            : "Create an account to sync progress across devices."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-950 transition focus:ring-2"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-950 transition focus:ring-2"
            placeholder="At least 6 characters"
          />
        </div>

        {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Working..." : mode === "login" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <div className="mt-5 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
        {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setMessage(null);
          }}
          className="font-medium text-slate-950 underline-offset-4 hover:underline"
        >
          {mode === "login" ? "Create one" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
