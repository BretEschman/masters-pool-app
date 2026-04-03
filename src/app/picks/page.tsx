"use client";

import { useState, useEffect } from "react";
import { Golfer } from "@/lib/types";

const TIER_CONFIG = [
  { tier: 1, label: "Tier 1", count: 3, odds: "4/1 to 50/1", desc: "The Favorites" },
  { tier: 2, label: "Tier 2", count: 2, odds: "55/1 to 125/1", desc: "Contenders" },
  { tier: 3, label: "Tier 3", count: 2, odds: "150/1 to 250/1", desc: "Dark Horses" },
  { tier: 4, label: "Tier 4", count: 1, odds: "300/1 to 2500/1", desc: "Long Shots" },
];

export default function PicksPage() {
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [picksOpen, setPicksOpen] = useState(false);
  const [yearId, setYearId] = useState("");
  const [name, setName] = useState("");
  const [tiebreaker, setTiebreaker] = useState("");
  const [selected, setSelected] = useState<Record<number, string[]>>({ 1: [], 2: [], 3: [], 4: [] });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();
  const totalPicked = Object.values(selected).flat().length;

  useEffect(() => {
    fetch(`/api/golfers?year=${currentYear}`)
      .then((r) => r.json())
      .then((data) => {
        setGolfers(data.golfers || []);
        setPicksOpen(data.picks_open || false);
        setYearId(data.year_id || "");
      });
  }, [currentYear]);

  function toggleGolfer(tier: number, golferId: string) {
    const config = TIER_CONFIG.find((t) => t.tier === tier)!;
    setSelected((prev) => {
      const current = prev[tier];
      if (current.includes(golferId)) {
        return { ...prev, [tier]: current.filter((id) => id !== golferId) };
      }
      if (current.length >= config.count) return prev;
      return { ...prev, [tier]: [...current, golferId] };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const allPicks = [...selected[1], ...selected[2], ...selected[3], ...selected[4]];
    if (allPicks.length !== 8) { setError("Please select all 8 golfers."); return; }
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!tiebreaker) { setError("Please enter a tiebreaker score."); return; }

    setSubmitting(true);
    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), tiebreaker_guess: Number(tiebreaker), golfer_ids: allPicks, year_id: yearId }),
    });
    if (res.ok) { setSubmitted(true); }
    else { const data = await res.json(); setError(data.error || "Submission failed"); }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Picks Locked In!
        </h2>
        <p className="text-[var(--text-secondary)] mb-6">Good luck, {name}!</p>
        <a href="/" className="text-[var(--masters-green-light)] hover:underline font-medium">
          View Leaderboard
        </a>
      </div>
    );
  }

  if (!picksOpen) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-[var(--text-secondary)]">Picks are closed for {currentYear}.</h2>
        <a href="/" className="text-[var(--masters-green-light)] hover:underline mt-4 block">View Leaderboard</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {currentYear} Picks
        </h2>
        <p className="text-[var(--text-secondary)]">Select 8 golfers across 4 tiers</p>
      </div>

      {/* Progress bar */}
      <div className="card p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[var(--text-secondary)]">Roster Progress</span>
          <span className="font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Oswald, sans-serif' }}>{totalPicked}/8</span>
        </div>
        <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--masters-green)] rounded-full transition-all duration-300"
            style={{ width: `${(totalPicked / 8) * 100}%`, boxShadow: totalPicked === 8 ? '0 0 10px var(--masters-green-glow)' : 'none' }}
          />
        </div>
      </div>

      {/* Name + Tiebreaker */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Your Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-medium)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--masters-green)] transition-colors"
              placeholder="Enter your name" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Tiebreaker (Winning Score)</label>
            <input type="number" value={tiebreaker} onChange={(e) => setTiebreaker(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-medium)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--masters-green)] transition-colors"
              placeholder="e.g. -11" />
          </div>
        </div>
      </div>

      {/* Tier sections */}
      {TIER_CONFIG.map(({ tier, label, count, odds, desc }) => {
        const tierGolfers = golfers.filter((g) => g.tier === tier);
        const selectedCount = selected[tier].length;
        const isTierComplete = selectedCount >= count;

        return (
          <div key={tier} className="card p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {label}
                  <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">{desc}</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{odds}</p>
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                isTierComplete
                  ? "bg-green-500/20 text-green-400"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
              }`} style={{ fontFamily: 'Oswald, sans-serif' }}>
                {selectedCount}/{count}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {tierGolfers.map((g) => {
                const isSelected = selected[tier].includes(g.id);
                const isFull = selectedCount >= count && !isSelected;
                return (
                  <button key={g.id} type="button" onClick={() => toggleGolfer(tier, g.id)} disabled={isFull}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      isSelected
                        ? "bg-[var(--masters-green)] text-white border-[var(--masters-green)] glow-green"
                        : isFull
                        ? "bg-[var(--bg-secondary)] text-[var(--text-muted)] border-transparent cursor-not-allowed opacity-40"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--masters-green)] hover:text-[var(--text-primary)]"
                    }`}>
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {error && (
        <p className="text-red-400 font-medium mb-4 text-center bg-red-400/10 rounded-xl px-4 py-3">{error}</p>
      )}

      <button type="submit" disabled={submitting || totalPicked !== 8}
        className={`w-full py-4 rounded-xl text-lg font-bold transition-all duration-300 ${
          totalPicked === 8
            ? "bg-[var(--masters-yellow)] text-[var(--bg-primary)] hover:opacity-90 glow-yellow"
            : "bg-[var(--bg-card)] text-[var(--text-muted)] cursor-not-allowed"
        }`}
        style={{ fontFamily: 'Poppins, sans-serif' }}>
        {submitting ? "Submitting..." : totalPicked === 8 ? "Lock In Picks ($25 Entry)" : `Select ${8 - totalPicked} more golfer${8 - totalPicked !== 1 ? 's' : ''}`}
      </button>
    </form>
  );
}
