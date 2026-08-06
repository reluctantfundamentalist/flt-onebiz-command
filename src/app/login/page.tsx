"use client";
import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { USERS } from "@/lib/users";

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    setNextPath(url.searchParams.get("next") ?? "/");
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError("Select a user.");
      return;
    }
    setPending(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Invalid credentials.");
      setPassword("");
      return;
    }
    router.replace(nextPath);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-8 shadow-sm"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand)] text-lg font-bold text-white">
            1B
          </div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Flt OneBiz Command</h1>
          <p className="mt-1 text-sm text-[var(--ink-faint)]">Leadership + BD workspace</p>
        </div>

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
          User
        </label>
        <select
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setError("");
          }}
          className="mb-4 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
        >
          <option value="">Select user</option>
          {USERS.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} — {u.title}
            </option>
          ))}
        </select>

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder="Password"
          className="mb-6 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
          autoComplete="current-password"
        />

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Enter"}
        </button>

        <p className="mt-4 text-center text-[11px] text-[var(--ink-faint)]">
          Seeded password: <code>onebiz2026</code> (change post-v0)
        </p>
      </form>
    </div>
  );
}
