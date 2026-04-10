"use client";

import { ParticipantStanding } from "@/lib/types";
import { useState } from "react";
import Reactions, { ReactionData } from "@/components/Reactions";

export type AllReactions = Record<string, Record<string, ReactionData>>;

interface Props {
  standings: ParticipantStanding[];
  winningScore: number | null;
  reactions: AllReactions;
  onToggleReaction: (participantId: string, emoji: string) => Promise<void>;
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

function GolferDetails({ s }: { s: ParticipantStanding }) {
  return (
    <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] px-4 py-4">
      <div className="grid gap-2">
        {[1, 2, 3, 4, 5, 6].map((tier) => {
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
  );
}

function MedalDot({ rank }: { rank: number }) {
  if (rank > 3) return null;
  const color = rank === 1 ? "#f2c75c" : rank === 2 ? "#a1a1aa" : "#cd7f32";
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}

export default function Leaderboard({ standings, reactions, onToggleReaction }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="card overflow-hidden">
      {/* Desktop Header */}
      <div className="hidden sm:grid grid-cols-[40px_1fr_repeat(5,48px)_44px] items-center px-4 py-3 border-b border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
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
          {/* Desktop Row */}
          <div
            className={`hidden sm:grid grid-cols-[40px_1fr_repeat(5,48px)_44px] items-center px-4 py-3 cursor-pointer transition-colors border-b border-[var(--border-subtle)] ${
              expandedId === s.participant.id ? "bg-[var(--bg-card-elevated)]" : "hover:bg-[var(--bg-card-hover)]"
            }`}
            onClick={() => setExpandedId(expandedId === s.participant.id ? null : s.participant.id)}
          >
            {/* Rank */}
            <span className={`text-sm font-bold flex items-center gap-1 ${
              s.rank === 1 ? "text-[var(--masters-yellow)]" : s.rank <= 3 ? "text-[var(--em-green)]" : "text-[var(--text-secondary)]"
            }`} style={{ fontFamily: 'Oswald, sans-serif' }}>
              <MedalDot rank={s.rank} />
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
              {s.participant.premium && (
                <span className="text-[10px] bg-[var(--masters-yellow)]/20 text-[var(--masters-yellow)] px-1.5 py-0.5 rounded-full font-semibold shrink-0 border border-[var(--masters-yellow)]/30">
                  VIP
                </span>
              )}
              {s.participant.paid && !s.participant.premium && (
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

          {/* Mobile Card */}
          <div
            className={`sm:hidden border-b border-[var(--border-subtle)] cursor-pointer transition-colors ${
              expandedId === s.participant.id ? "bg-[var(--bg-card-elevated)]" : "active:bg-[var(--bg-card-hover)]"
            }`}
            onClick={() => setExpandedId(expandedId === s.participant.id ? null : s.participant.id)}
          >
            <div className="px-4 py-3">
              {/* Top row: Rank, Name, Total */}
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold w-7 shrink-0 flex items-center gap-1 ${
                  s.rank === 1 ? "text-[var(--masters-yellow)]" : s.rank <= 3 ? "text-[var(--em-green)]" : "text-[var(--text-secondary)]"
                }`} style={{ fontFamily: 'Oswald, sans-serif' }}>
                  <MedalDot rank={s.rank} />
                  {s.rank}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  idx === 0 ? "bg-[var(--masters-yellow)]/20 text-[var(--masters-yellow)]"
                  : "bg-[var(--bg-card-elevated)] text-[var(--text-secondary)]"
                }`}>
                  {s.participant.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-medium text-sm text-[var(--text-primary)] truncate">
                    {s.participant.name}
                  </span>
                  {s.participant.premium && (
                    <span className="text-[10px] bg-[var(--masters-yellow)]/20 text-[var(--masters-yellow)] px-1.5 py-0.5 rounded-full font-semibold shrink-0 border border-[var(--masters-yellow)]/30">
                      VIP
                    </span>
                  )}
                  {s.participant.paid && !s.participant.premium && (
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                      PAID
                    </span>
                  )}
                </div>
                <span className="font-bold text-lg text-[var(--text-primary)] shrink-0" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {s.total}
                </span>
              </div>

              {/* Bottom row: Round scores + tiebreaker */}
              <div className="flex items-center gap-3 mt-2 ml-10 pl-1">
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span>R1: <ScoreCell score={s.day1_score} /></span>
                  <span>R2: <ScoreCell score={s.day2_score} /></span>
                  <span>R3: <ScoreCell score={s.day3_score} /></span>
                  <span>R4: <ScoreCell score={s.day4_score} /></span>
                  <span className="text-[var(--text-muted)]">TB: {s.participant.tiebreaker_guess}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reactions row */}
          <div className="border-b border-[var(--border-subtle)]">
            <Reactions
              participantId={s.participant.id}
              reactions={reactions[s.participant.id] || {}}
              onToggle={onToggleReaction}
            />
          </div>

          {/* Expanded golfer details (shared) */}
          {expandedId === s.participant.id && <GolferDetails s={s} />}
        </div>
      ))}
    </div>
  );
}
