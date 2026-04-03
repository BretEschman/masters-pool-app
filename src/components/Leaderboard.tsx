"use client";

import { ParticipantStanding } from "@/lib/types";
import { useState } from "react";

interface Props {
  standings: ParticipantStanding[];
  winningScore: number | null;
}

function ScoreCell({ score }: { score: number }) {
  const color = score < 0 ? "text-green-400" : score > 0 ? "text-red-400" : "text-[var(--text-secondary)]";
  return <span className={`${color} tabular-nums`} style={{ fontFamily: 'Oswald, sans-serif' }}>{score}</span>;
}

function GolferScoreCell({ score }: { score: number | null }) {
  if (score === null) return <span className="text-[var(--text-muted)]">-</span>;
  const color = score < 0 ? "text-green-400" : score > 0 ? "text-red-400" : "text-[var(--text-secondary)]";
  return <span className={`${color} tabular-nums text-xs`}>{score}</span>;
}

export default function Leaderboard({ standings }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_repeat(5,48px)_44px] items-center px-4 py-3 border-b border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
        <span>#</span>
        <span>Player</span>
        <span className="text-center">R1</span>
        <span className="text-center">R2</span>
        <span className="text-center">R3</span>
        <span className="text-center">R4</span>
        <span className="text-center">Tot</span>
        <span className="text-center">TB</span>
      </div>

      {/* Rows */}
      {standings.map((s, idx) => (
        <div key={s.participant.id}>
          <div
            className={`grid grid-cols-[40px_1fr_repeat(5,48px)_44px] items-center px-4 py-3 cursor-pointer transition-colors border-b border-[var(--border-subtle)] ${
              expandedId === s.participant.id ? "bg-[var(--bg-card-elevated)]" : "hover:bg-[var(--bg-card-hover)]"
            }`}
            onClick={() => setExpandedId(expandedId === s.participant.id ? null : s.participant.id)}
          >
            {/* Rank */}
            <span className={`text-sm font-bold ${
              s.rank === 1 ? "text-[var(--masters-yellow)]" : s.rank <= 3 ? "text-[var(--masters-green-light)]" : "text-[var(--text-secondary)]"
            }`} style={{ fontFamily: 'Oswald, sans-serif' }}>
              {s.rank}
            </span>

            {/* Name */}
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                idx === 0 ? "bg-[var(--masters-yellow)]/20 text-[var(--masters-yellow)]"
                : "bg-[var(--bg-card-elevated)] text-[var(--text-secondary)]"
              }`}>
                {s.participant.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-sm text-[var(--text-primary)] truncate">
                {s.participant.name}
              </span>
              {s.participant.paid && (
                <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                  PAID
                </span>
              )}
            </div>

            {/* Scores */}
            <span className="text-center"><ScoreCell score={s.day1_score} /></span>
            <span className="text-center"><ScoreCell score={s.day2_score} /></span>
            <span className="text-center"><ScoreCell score={s.day3_score} /></span>
            <span className="text-center"><ScoreCell score={s.day4_score} /></span>
            <span className="text-center font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1rem' }}>
              {s.total}
            </span>
            <span className="text-center text-xs text-[var(--text-muted)]">
              {s.participant.tiebreaker_guess}
            </span>
          </div>

          {/* Expanded golfer details */}
          {expandedId === s.participant.id && (
            <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] px-4 py-4">
              <div className="grid gap-2">
                {[1, 2, 3, 4].map((tier) => {
                  const tierGolfers = s.golfers.filter((g) => g.tier === tier).sort((a, b) => a.name.localeCompare(b.name));
                  if (tierGolfers.length === 0) return null;
                  return (
                    <div key={tier}>
                      <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                        Tier {tier}
                      </div>
                      {tierGolfers.map((g) => (
                        <div key={g.id} className="grid grid-cols-[1fr_repeat(4,40px)_60px] items-center py-1.5 text-sm">
                          <span className="text-[var(--text-secondary)]">{g.name}</span>
                          <GolferScoreCell score={g.day1_score} />
                          <GolferScoreCell score={g.day2_score} />
                          <GolferScoreCell score={g.day3_score} />
                          <GolferScoreCell score={g.day4_score} />
                          <span className="text-right">
                            {g.status !== "active" && (
                              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-semibold">
                                {g.status.toUpperCase()}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
