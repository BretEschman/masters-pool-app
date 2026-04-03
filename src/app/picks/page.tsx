"use client";

import { useState, useEffect } from "react";
import { Golfer } from "@/lib/types";

const TIER_CONFIG = [
  { tier: 1, label: "Tier 1", count: 3, odds: "4/1 to 50/1" },
  { tier: 2, label: "Tier 2", count: 2, odds: "55/1 to 125/1" },
  { tier: 3, label: "Tier 3", count: 2, odds: "150/1 to 250/1" },
  { tier: 4, label: "Tier 4", count: 1, odds: "300/1 to 2500/1" },
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
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-[var(--masters-green)] mb-4">Picks Submitted!</h2>
        <p className="text-gray-600 mb-4">Good luck, {name}! Your picks have been locked in for the {currentYear} Master&apos;s Pool.</p>
        <a href="/" className="text-[var(--masters-green)] underline font-medium">View Leaderboard</a>
      </div>
    );
  }

  if (!picksOpen) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-600">Picks are currently closed for {currentYear}.</h2>
        <a href="/" className="text-[var(--masters-green)] underline mt-4 block">View Leaderboard</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-[var(--masters-green)] mb-6">{currentYear} Master&apos;s Pool - Submit Your Picks</h2>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Your Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Enter your name" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Tiebreaker: Winning Score (e.g. -11)</label>
            <input type="number" value={tiebreaker} onChange={(e) => setTiebreaker(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="-11" />
          </div>
        </div>
      </div>
      {TIER_CONFIG.map(({ tier, label, count, odds }) => {
        const tierGolfers = golfers.filter((g) => g.tier === tier);
        const selectedCount = selected[tier].length;
        return (
          <div key={tier} className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-bold text-[var(--masters-green)] mb-1">{label} - Pick {count} ({odds})</h3>
            <p className="text-sm text-gray-500 mb-3">{selectedCount}/{count} selected</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {tierGolfers.map((g) => {
                const isSelected = selected[tier].includes(g.id);
                const isFull = selectedCount >= count && !isSelected;
                return (
                  <button key={g.id} type="button" onClick={() => toggleGolfer(tier, g.id)} disabled={isFull}
                    className={`px-3 py-2 rounded border text-sm font-medium transition ${
                      isSelected ? "bg-[var(--masters-green)] text-white border-[var(--masters-green)]"
                      : isFull ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-white text-gray-700 border-gray-300 hover:border-[var(--masters-green)]"
                    }`}>
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {error && <p className="text-red-600 font-medium mb-4 text-center">{error}</p>}
      <button type="submit" disabled={submitting}
        className="w-full bg-[var(--masters-yellow)] text-[var(--masters-dark)] py-3 rounded-lg text-lg font-bold hover:opacity-90 disabled:opacity-50">
        {submitting ? "Submitting..." : "Submit Picks ($25 Entry)"}
      </button>
    </form>
  );
}
