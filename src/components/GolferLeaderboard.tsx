"use client";

import { Golfer } from "@/lib/types";

interface Props {
  golfers: Golfer[];
}

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) return <span className="text-[var(--text-muted)]">-</span>;
  const color = score < 0 ? "text-green-400" : score > 0 ? "text-red-400" : "text-[var(--text-secondary)]";
  return <span className={`${color} tabular-nums`} style={{ fontFamily: 'Oswald, sans-serif' }}>{score}</span>;
}

function golferTotal(g: Golfer): number | null {
  const scores = [g.day1_score, g.day2_score, g.day3_score, g.day4_score].filter(
    (s): s is number => s !== null
  );
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0);
}

export default function GolferLeaderboard({ golfers }: Props) {
  const sorted = [...golfers].sort((a, b) => {
    const totA = golferTotal(a);
    const totB = golferTotal(b);
    // Golfers with no scores go to the bottom
    if (totA === null && totB === null) return a.name.localeCompare(b.name);
    if (totA === null) return 1;
    if (totB === null) return -1;
    // Cut/WD golfers sort after active golfers with same score
    if (totA !== totB) return totA - totB;
    if (a.status !== b.status) {
      if (a.status === "active") return -1;
      if (b.status === "active") return 1;
    }
    return a.name.localeCompare(b.name);
  });

  // Assign ranks
  let currentRank = 1;
  const ranked = sorted.map((g, idx) => {
    const total = golferTotal(g);
    if (idx > 0) {
      const prevTotal = golferTotal(sorted[idx - 1]);
      if (total !== prevTotal) currentRank = idx + 1;
    }
    return { ...g, total, rank: total !== null ? currentRank : null };
  });

  return (
    <div className="card overflow-hidden">
      {/* Desktop Header */}
      <div className="hidden sm:grid grid-cols-[40px_1fr_60px_repeat(4,48px)_56px_64px] items-center px-4 py-3 border-b border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
        <span>#</span>
        <span>Golfer</span>
        <span className="text-center">Tier</span>
        <span className="text-center">R1</span>
        <span className="text-center">R2</span>
        <span className="text-center">R3</span>
        <span className="text-center">R4</span>
        <span className="text-center">Tot</span>
        <span className="text-center">Status</span>
      </div>

      {/* Desktop Rows */}
      {ranked.map((g) => (
        <div key={g.id}>
          {/* Desktop Row */}
          <div className="hidden sm:grid grid-cols-[40px_1fr_60px_repeat(4,48px)_56px_64px] items-center px-4 py-3 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] transition-colors">
            <span className={`text-sm font-bold ${
              g.rank === 1 ? "text-[var(--masters-yellow)]" : g.rank !== null && g.rank <= 3 ? "text-[var(--em-green)]" : "text-[var(--text-secondary)]"
            }`} style={{ fontFamily: 'Oswald, sans-serif' }}>
              {g.rank ?? "-"}
            </span>
            <span className="font-medium text-sm text-[var(--text-primary)] truncate">{g.name}</span>
            <span className="text-center text-xs text-[var(--text-muted)]">T{g.tier}</span>
            <span className="text-center"><ScoreCell score={g.day1_score} /></span>
            <span className="text-center"><ScoreCell score={g.day2_score} /></span>
            <span className="text-center"><ScoreCell score={g.day3_score} /></span>
            <span className="text-center"><ScoreCell score={g.day4_score} /></span>
            <span className="text-center font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1rem' }}>
              {g.total !== null ? g.total : "-"}
            </span>
            <span className="text-center">
              {g.status !== "active" ? (
                <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-semibold">
                  {g.status.toUpperCase()}
                </span>
              ) : (
                <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-semibold">
                  ACTIVE
                </span>
              )}
            </span>
          </div>

          {/* Mobile Card */}
          <div className="sm:hidden border-b border-[var(--border-subtle)] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold w-7 shrink-0 ${
                g.rank === 1 ? "text-[var(--masters-yellow)]" : g.rank !== null && g.rank <= 3 ? "text-[var(--em-green)]" : "text-[var(--text-secondary)]"
              }`} style={{ fontFamily: 'Oswald, sans-serif' }}>
                {g.rank ?? "-"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[var(--text-primary)] truncate">{g.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded-full font-semibold shrink-0">T{g.tier}</span>
                  {g.status !== "active" && (
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                      {g.status.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                  <span>R1: <ScoreCell score={g.day1_score} /></span>
                  <span>R2: <ScoreCell score={g.day2_score} /></span>
                  <span>R3: <ScoreCell score={g.day3_score} /></span>
                  <span>R4: <ScoreCell score={g.day4_score} /></span>
                </div>
              </div>
              <span className="font-bold text-lg text-[var(--text-primary)] shrink-0" style={{ fontFamily: 'Oswald, sans-serif' }}>
                {g.total !== null ? g.total : "-"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
