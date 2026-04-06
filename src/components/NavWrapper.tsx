"use client";

import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import MobileNav from "./MobileNav";

export default function NavWrapper() {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    setHasAccess(sessionStorage.getItem("pool_access") === "true");

    // Listen for storage changes (when user enters access code on home page)
    const handleStorage = () => {
      setHasAccess(sessionStorage.getItem("pool_access") === "true");
    };
    window.addEventListener("storage", handleStorage);

    // Also poll briefly since sessionStorage events don't fire in the same tab
    const interval = setInterval(() => {
      const current = sessionStorage.getItem("pool_access") === "true";
      if (current !== hasAccess) setHasAccess(current);
    }, 500);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  });

  if (!hasAccess) {
    return (
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    );
  }

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden sm:flex items-center gap-3 text-sm">
        <a href="/live" className="font-medium text-[var(--em-green)] hover:opacity-80 transition-opacity flex items-center gap-1">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--em-green)] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--em-green)]"></span></span>
          Live
        </a>
        <a href="/rules" className="font-medium text-[var(--text-secondary)] hover:text-[var(--em-green)] transition-colors">Rules</a>
        <a href="/picks" className="font-medium text-[var(--text-secondary)] hover:text-[var(--em-green)] transition-colors">Picks</a>
        <a href="/distribution" className="font-medium text-[var(--text-secondary)] hover:text-[var(--em-green)] transition-colors">Stats</a>
        <a href="/history" className="font-medium text-[var(--text-secondary)] hover:text-[var(--em-green)] transition-colors">History</a>
        <a href="/payouts" className="font-medium text-[var(--text-secondary)] hover:text-[var(--em-green)] transition-colors">Payouts</a>
        <a href="/chat" className="font-medium text-[var(--text-secondary)] hover:text-[var(--em-green)] transition-colors">Chat</a>
        <a href="/share" className="font-medium text-[var(--text-secondary)] hover:text-[var(--em-green)] transition-colors">Share</a>
        <a href="/pay" className="font-medium text-[var(--masters-yellow)] hover:opacity-80 transition-opacity">Pay</a>
        <a href="/admin" className="font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Admin</a>
        <ThemeToggle />
      </nav>

      {/* Mobile nav */}
      <div className="flex items-center gap-2 sm:hidden">
        <ThemeToggle />
        <MobileNav />
      </div>
    </>
  );
}
