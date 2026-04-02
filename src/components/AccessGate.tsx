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
    <div className="flex items-center justify-center min-h-[60vh]">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-xl font-bold text-[var(--masters-green)] mb-4">Enter Pool Access Code</h2>
        <input
          type="password"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="Access code"
        />
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <button type="submit" className="w-full bg-[var(--masters-green)] text-white py-2 rounded hover:bg-[var(--masters-dark)]">
          Enter
        </button>
      </form>
    </div>
  );
}
