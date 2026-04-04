"use client";

import { useEffect, useState } from "react";

interface YearResult {
  year: number;
  rank: number;
  total: number;
}

interface ParticipantHistory {
  name: string;
  years_played: number;
  results: YearResult[];
  best_finish: number;
  average_finish: number;
  wins: number;
}

interface Records {
  best_score: { name: string; year: number; score: number } | null;
  most_wins: { name: string; wins: number } | null;
  most_appearances: { name: string; count: number } | null;
}

interface YearWinner {
  year: number;
  winner: string;
  winning_total: number;
}

export default function HistoryPage() {
  const [participants, setParticipants] = useState<ParticipantHistory[]>([]);
  const [records, setRecords] = useState<Records>({
    best_score: null,
    most_wins: null,
    most_appearances: null,
  });
  const [yearResults, setYearResults] = useState<YearWinner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => {
        setParticipants(data.participants || []);
        setRecords(data.records || { best_score: null, most_wins: null, most_appearances: null });
        setYearResults(data.year_results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[var(--em-green-dark)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  function formatScore(score: number) {
    if (score === 0) return "E";
    return score > 0 ? `+${score}` : `${score}`;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-[var(--text-primary)] mb-1"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          All-Time History
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Aggregated stats across all years
        </p>
      </div>

      {/* Records Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {records.best_score && (
          <div className="card p-5">
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Best Single-Year Score
            </div>
            <div
              className="text-2xl font-bold text-[var(--em-green)]"
              style={{ fontFamily: "Oswald, sans-serif" }}
            >
              {formatScore(records.best_score.score)}
            </div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              {records.best_score.name} ({records.best_score.year})
            </div>
          </div>
        )}
        {records.most_wins && (
          <div className="card p-5">
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Most Wins
            </div>
            <div
              className="text-2xl font-bold text-[var(--masters-yellow)]"
              style={{ fontFamily: "Oswald, sans-serif" }}
            >
              {records.most_wins.wins}
            </div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              {records.most_wins.name}
            </div>
          </div>
        )}
        {records.most_appearances && (
          <div className="card p-5">
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Most Appearances
            </div>
            <div
              className="text-2xl font-bold text-[var(--text-primary)]"
              style={{ fontFamily: "Oswald, sans-serif" }}
            >
              {records.most_appearances.count}
            </div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              {records.most_appearances.name}
            </div>
          </div>
        )}
      </div>

      {/* All-Time Leaderboard */}
      {participants.length > 0 && (
        <div className="card p-6 mb-8">
          <h2
            className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4"
          >
            All-Time Leaderboard
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-medium)]">
                  <th className="text-left py-2 pr-4 text-[var(--text-muted)] font-semibold">
                    Name
                  </th>
                  <th className="text-center py-2 px-3 text-[var(--text-muted)] font-semibold">
                    Yrs
                  </th>
                  <th className="text-center py-2 px-3 text-[var(--text-muted)] font-semibold">
                    Best
                  </th>
                  <th className="text-center py-2 px-3 text-[var(--text-muted)] font-semibold">
                    Avg
                  </th>
                  <th className="text-center py-2 px-3 text-[var(--text-muted)] font-semibold">
                    Wins
                  </th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr
                    key={p.name}
                    className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] transition-colors"
                  >
                    <td className="py-2.5 pr-4 font-medium text-[var(--text-primary)]">
                      {p.name}
                    </td>
                    <td
                      className="text-center py-2.5 px-3 text-[var(--text-secondary)]"
                      style={{ fontFamily: "Oswald, sans-serif" }}
                    >
                      {p.years_played}
                    </td>
                    <td
                      className="text-center py-2.5 px-3 text-[var(--text-secondary)]"
                      style={{ fontFamily: "Oswald, sans-serif" }}
                    >
                      {p.best_finish === 1 ? (
                        <span className="text-[var(--masters-yellow)] font-bold">1st</span>
                      ) : (
                        `${p.best_finish}${ordinalSuffix(p.best_finish)}`
                      )}
                    </td>
                    <td
                      className="text-center py-2.5 px-3 text-[var(--text-secondary)]"
                      style={{ fontFamily: "Oswald, sans-serif" }}
                    >
                      {p.average_finish}
                    </td>
                    <td
                      className="text-center py-2.5 px-3"
                      style={{ fontFamily: "Oswald, sans-serif" }}
                    >
                      {p.wins > 0 ? (
                        <span className="text-[var(--em-green)] font-bold">{p.wins}</span>
                      ) : (
                        <span className="text-[var(--text-muted)]">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Year-by-Year Results */}
      {yearResults.length > 0 && (
        <div className="card p-6">
          <h2
            className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4"
          >
            Year-by-Year Results
          </h2>
          <div className="space-y-2">
            {yearResults
              .slice()
              .reverse()
              .map((yr) => (
                <div
                  key={yr.year}
                  className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
                >
                  <span
                    className="text-sm font-bold text-[var(--text-primary)]"
                    style={{ fontFamily: "Oswald, sans-serif" }}
                  >
                    {yr.year}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {yr.winner}
                    </span>
                    <span
                      className="text-sm font-bold text-[var(--em-green)]"
                      style={{ fontFamily: "Oswald, sans-serif" }}
                    >
                      {formatScore(yr.winning_total)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
