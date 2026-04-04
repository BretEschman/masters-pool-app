"use client";

import { useState, useEffect } from "react";
import MastersLogo from "./MastersLogo";

interface Props {
  children: (paid: boolean) => React.ReactNode;
}

export default function AccessGate({ children }: Props) {
  const [accessCode, setAccessCode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [name, setName] = useState("");
  const [identified, setIdentified] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [checking, setChecking] = useState(true);

  // On mount: restore session AND re-check paid status from API
  useEffect(() => {
    const stored = sessionStorage.getItem("pool_access");
    const storedName = sessionStorage.getItem("pool_name");

    if (stored) setAuthenticated(true);

    if (storedName) {
      setName(storedName);
      setIdentified(true);
      // Re-check paid status from API (don't rely on cached value)
      fetch(`/api/check-participant?name=${encodeURIComponent(storedName)}`)
        .then((r) => r.json())
        .then((data) => {
          setPaid(data.paid);
          sessionStorage.setItem("pool_paid", String(data.paid));
          setChecking(false);
        })
        .catch(() => {
          setPaid(sessionStorage.getItem("pool_paid") === "true");
          setChecking(false);
        });
    } else {
      setChecking(false);
    }
  }, []);

  async function handleAccessSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/verify-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: accessCode }),
    });
    if (res.ok) {
      sessionStorage.setItem("pool_access", "true");
      sessionStorage.setItem("pool_access_code", accessCode);
      setAuthenticated(true);
    } else {
      setError("Invalid access code");
    }
  }

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    const res = await fetch(`/api/check-participant?name=${encodeURIComponent(name.trim())}`);
    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem("pool_name", name.trim());
      sessionStorage.setItem("pool_paid", String(data.paid));
      setIdentified(true);
      setPaid(data.paid);
    } else {
      setNameError("Name not found. Submit your picks first, then come back.");
    }
  }

  // Step 1: Access code
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[75vh]">
        <div className="card w-full max-w-md text-center overflow-hidden">
          <div className="relative bg-gradient-to-b from-[#0d1a0d] to-[var(--bg-card)] pt-8 pb-6 px-8">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-0 right-0 h-px bg-[var(--em-green)]" />
              <div className="absolute top-8 left-0 right-0 h-px bg-[var(--em-green)]" />
              <div className="absolute top-12 left-0 right-0 h-px bg-[var(--em-green)]" />
            </div>
            <div className="relative mx-auto mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-[var(--em-green)] opacity-15 blur-xl" />
              </div>
              <MastersLogo size={96} className="relative mx-auto" />
            </div>
            <h1 className="text-xl sm:text-2xl tracking-tight mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="font-black text-white">MASTER&apos;S</span>
              <span className="font-black text-[var(--em-green)]"> POOL</span>
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em]">
              powered by <span className="font-bold text-[var(--text-secondary)]">ESCH</span>
              <span className="font-bold text-[var(--em-green)]">METRICS</span>
            </p>
          </div>
          <div className="px-6 sm:px-8 pb-8 pt-6">
            <form onSubmit={handleAccessSubmit}>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 text-left">
                Access Code
              </label>
              <input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-lg px-4 py-3 mb-4 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--em-green)] focus:ring-1 focus:ring-[var(--em-green)] transition-colors"
                placeholder="Enter access code" />
              {error && <p className="text-red-400 text-sm mb-3 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" className="w-full bg-[var(--em-green)] text-black py-3 rounded-lg font-bold hover:bg-[var(--em-green-dark)] hover:text-white transition-colors">
                Enter Pool
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Identify yourself
  if (!identified) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card p-6 sm:p-8 w-full max-w-sm text-center">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Who are you?</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">Enter your name to view the leaderboard</p>
          <form onSubmit={handleNameSubmit}>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-lg px-4 py-3 mb-4 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--em-green)] focus:ring-1 focus:ring-[var(--em-green)] transition-colors"
              placeholder="Your name" />
            {nameError && <p className="text-red-400 text-sm mb-3 bg-red-400/10 rounded-lg px-3 py-2">{nameError}</p>}
            <button type="submit" className="w-full bg-[var(--em-green)] text-black py-3 rounded-lg font-bold hover:bg-[var(--em-green-dark)] hover:text-white transition-colors">
              Continue
            </button>
          </form>
          <a href="/picks" className="text-sm text-[var(--em-green)] hover:underline mt-4 block">
            Haven&apos;t submitted picks yet? Do that first
          </a>
        </div>
      </div>
    );
  }

  // Still checking paid status
  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[var(--em-green)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Step 3: Show content (pass paid status)
  return <>{children(paid)}</>;
}
