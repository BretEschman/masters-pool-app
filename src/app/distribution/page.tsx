"use client";

import { useEffect, useState } from "react";

interface GolferDist {
  name: string;
  tier: number;
  pick_count: number;
}

const TIER_LABELS: Record<number, string> = {
  1: "Tier 1 — Favorites",
  2: "Tier 2 — Contenders",
  3: "Tier 3 — Dark Horses",
  4: "Tier 4 — Sleepers",
  5: "Tier 5 — Long Shots",
  6: "Tier 6 — Flyers",
};

export default function DistributionPage() {
  const [distribution, setDistribution] = useState<GolferDist[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetch(`/api/distribution?year=${currentYear}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.locked) {
          setLocked(true);
        } else {
          setDistribution(data.distribution || []);
          setTotalParticipants(data.total_participants || 0);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[var(--em-green-dark)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">&#128274;</div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Pick Distribution Hidden
        </h2>
        <p className="text-[var(--text-secondary)]">
          Distribution stats will be available once picks are closed for {currentYear}.
        </p>
      </div>
    );
  }

  // Group by tier
  const tiers = Array.from(new Set(distribution.map((g) => g.tier))).sort(
    (a, b) => a - b
  );

  // Find max pick count across all golfers for bar scaling
  const maxPicks = Math.max(...distribution.map((g) => g.pick_count), 1);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-[var(--text-primary)] mb-1"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {currentYear} Pick Distribution
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          How many of {totalParticipants} participants picked each golfer
        </p>
      </div>

      {tiers.map((tier) => {
        const tierGolfers = distribution
          .filter((g) => g.tier === tier)
          .sort((a, b) => b.pick_count - a.pick_count);

        return (
          <div key={tier} className="card p-6 mb-4">
            <h3
              className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4"
            >
              {TIER_LABELS[tier] || `Tier ${tier}`}
            </h3>
            <div className="space-y-3">
              {tierGolfers.map((g) => {
                const pct =
                  totalParticipants > 0
                    ? (g.pick_count / maxPicks) * 100
                    : 0;
                return (
                  <div key={g.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {g.name}
                      </span>
                      <span
                        className="text-sm text-[var(--text-secondary)]"
                        style={{ fontFamily: "Oswald, sans-serif" }}
                      >
                        {g.pick_count}/{totalParticipants}
                        <span className="text-[var(--text-muted)] ml-1">picks</span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: "var(--em-green)",
                          minWidth: g.pick_count > 0 ? "4px" : "0",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
