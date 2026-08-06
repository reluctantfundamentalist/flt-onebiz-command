"use client";
import { useState } from "react";
import { BUSINESS_MANAGERS, AIRLINES, ACCESS_PIN, type Session } from "@/lib/accounts";

interface Props {
  onLogin: (session: Session) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [bm, setBm] = useState("");
  const [airline, setAirline] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    if (!bm || !airline) {
      setError("Please select a Business Manager and an Airline.");
      return;
    }
    if (pin !== ACCESS_PIN) {
      setError("Invalid access PIN.");
      setPin("");
      return;
    }
    setError("");
    onLogin({ bm: bm as Session["bm"], airline: airline as Session["airline"] });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-8 shadow-sm">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand)] text-lg font-bold text-white">
            1B
          </div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Flt OneBiz</h1>
          <p className="mt-1 text-sm text-[var(--ink-faint)]">BD Intelligence Dashboard</p>
        </div>

        {/* BM Dropdown */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
            Business Manager
          </label>
          <select
            value={bm}
            onChange={(e) => { setBm(e.target.value); setError(""); }}
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
          >
            <option value="">Select Business Manager</option>
            {BUSINESS_MANAGERS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Airline Dropdown */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
            Airline
          </label>
          <select
            value={airline}
            onChange={(e) => { setAirline(e.target.value); setError(""); }}
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
          >
            <option value="">Select Airline</option>
            {AIRLINES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* PIN */}
        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
            Access PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
            placeholder="Enter 4-digit PIN"
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm tracking-[0.3em] text-[var(--ink)] outline-none placeholder:tracking-normal focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] active:scale-[0.98]"
        >
          Enter Dashboard
        </button>

        <p className="mt-4 text-center text-[11px] text-[var(--ink-faint)]">
          Prototype · PIN access for all accounts and business managers
        </p>
      </div>
    </div>
  );
}
