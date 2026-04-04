"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

function MobileMenu({ onClose }: { onClose: () => void }) {
  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const links: { href: string; label: string; live?: boolean; highlight?: boolean; muted?: boolean }[] = [
    { href: "/live", label: "Live Tracker", live: true },
    { href: "/", label: "Leaderboard" },
    { href: "/picks", label: "Submit Picks" },
    { href: "/rules", label: "Rules" },
    { href: "/distribution", label: "Pick Distribution" },
    { href: "/history", label: "All-Time History" },
    { href: "/payouts", label: "Payouts" },
    { href: "/chat", label: "Trash Talk" },
    { href: "/share", label: "Share Card" },
    { href: "/pay", label: "Pay $25", highlight: true },
    { href: "/admin", label: "Admin", muted: true },
  ];

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 56,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: "#0a0a0a",
      }}
    >
      <nav style={{ display: "flex", flexDirection: "column", padding: 24, gap: 4 }}>
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={onClose}
            style={{
              padding: "14px 16px",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 500,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: link.live ? "#22c55e" : link.highlight ? "#f2c75c" : link.muted ? "#71717a" : "#a1a1aa",
              backgroundColor: link.highlight ? "rgba(242,199,92,0.1)" : "transparent",
            }}
          >
            {link.live && (
              <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
                <span style={{ position: "absolute", display: "inline-flex", width: "100%", height: "100%", borderRadius: "50%", backgroundColor: "#22c55e", opacity: 0.75, animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
                <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e" }} />
              </span>
            )}
            {link.label}
          </a>
        ))}
      </nav>
    </div>,
    document.body
  );
}

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="sm:hidden flex flex-col gap-1.5 p-2 -mr-2"
        aria-label="Menu"
      >
        <span className={`block w-5 h-0.5 bg-[var(--text-secondary)] transition-transform ${open ? "rotate-45 translate-y-2" : ""}`} />
        <span className={`block w-5 h-0.5 bg-[var(--text-secondary)] transition-opacity ${open ? "opacity-0" : ""}`} />
        <span className={`block w-5 h-0.5 bg-[var(--text-secondary)] transition-transform ${open ? "-rotate-45 -translate-y-2" : ""}`} />
      </button>

      {mounted && open && <MobileMenu onClose={() => setOpen(false)} />}
    </>
  );
}
