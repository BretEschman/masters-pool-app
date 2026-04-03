"use client";

import { useState, useEffect } from "react";

export default function AccessGate({ children }: { children: React.ReactNode }) {
  const [accessCode, setAccessCode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("pool_access");
    if (stored) setAuthenticated(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/verify-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: accessCode }),
    });
    if (res.ok) {
      sessionStorage.setItem("pool_access", "true");
      setAuthenticated(true);
    } else {
      setError("Invalid access code");
    }
  }

  if (authenticated) return <>{children}</>;

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="card p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--masters-green)] flex items-center justify-center mx-auto mb-6 glow-green">
          <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>MP</span>
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Enter Pool
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Enter your access code to view the leaderboard
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-medium)] rounded-xl px-4 py-3 mb-4 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--masters-green)] focus:ring-1 focus:ring-[var(--masters-green)] transition-colors"
            placeholder="Access code"
          />
          {error && (
            <p className="text-red-400 text-sm mb-3 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-[var(--masters-green)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--masters-green-light)] transition-colors glow-green"
          >
            Enter Pool
          </button>
        </form>
      </div>
    </div>
  );
}
