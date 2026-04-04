"use client";

import { useEffect, useState, useCallback } from "react";
import { ParticipantStanding, Year } from "@/lib/types";

function ScoreCell({ score }: { score: number }) {
  const color =
    score < 0
      ? "text-green-400"
      : score > 0
      ? "text-red-400"
      : "text-[#a1a1aa]";
  return (
    <span className={color} style={{ fontFamily: "Oswald, sans-serif", fontWeight: 500 }}>
      {score}
    </span>
  );
}

function MedalDot({ rank }: { rank: number }) {
  if (rank > 3) return null;
  const color =
    rank === 1 ? "#f2c75c" : rank === 2 ? "#a1a1aa" : "#cd7f32";
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}

export default function SharePage() {
  const [standings, setStandings] = useState<ParticipantStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [copied, setCopied] = useState(false);
  const [years, setYears] = useState<Year[]>([]);

  // Parse year from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const y = params.get("year");
    if (y) setYear(Number(y));
  }, []);

  useEffect(() => {
    fetch("/api/years")
      .then((r) => r.json())
      .then((data: Year[]) => setYears(data))
      .catch(() => {});
  }, []);

  const fetchStandings = useCallback((y: number) => {
    setLoading(true);
    fetch(`/api/standings?year=${y}`)
      .then((r) => r.json())
      .then((data) => {
        setStandings(data.standings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStandings(year);
  }, [year, fetchStandings]);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/share?year=${year}`
    : `/share?year=${year}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const top10 = standings.slice(0, 10);

  return (
    <div className="flex flex-col items-center py-4">
      {/* Controls above the card */}
      <div className="flex items-center gap-3 mb-4">
        {years.length > 0 && (
          <select
            value={year}
            onChange={(e) => {
              const newYear = Number(e.target.value);
              setYear(newYear);
              window.history.replaceState(null, "", `/share?year=${newYear}`);
            }}
            className="bg-[var(--bg-card)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm font-bold text-[var(--text-primary)] focus:outline-none cursor-pointer"
          >
            {years.map((y) => (
              <option key={y.year} value={y.year}>
                {y.year}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-medium)] hover:border-[var(--em-green)] rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--em-green)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>

      <p className="text-xs text-[var(--text-muted)] mb-4 text-center max-w-md">
        Screenshot the card below to share, or copy the link above.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--em-green-dark)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : standings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-secondary)]">No standings data for {year}.</p>
        </div>
      ) : (
        /* The shareable card */
        <div
          style={{
            width: 600,
            background: "#0a0a0a",
            borderRadius: 16,
            border: "1px solid #27272a",
            overflow: "hidden",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          {/* Card header */}
          <div
            style={{
              padding: "24px 28px 16px",
              borderBottom: "1px solid #1e1e1e",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    color: "#f1f5f9",
                  }}
                >
                  MASTER&apos;S
                </span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    color: "#22c55e",
                  }}
                >
                  POOL
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#71717a",
                  marginTop: 2,
                  fontWeight: 500,
                }}
              >
                {year} Standings
              </div>
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#f2c75c",
                fontFamily: "Oswald, sans-serif",
                letterSpacing: "-0.02em",
              }}
            >
              {year}
            </div>
          </div>

          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "36px 1fr 44px 44px 44px 44px 52px",
              padding: "10px 28px",
              borderBottom: "1px solid #1e1e1e",
              fontSize: 10,
              fontWeight: 700,
              color: "#71717a",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <span>#</span>
            <span>Player</span>
            <span style={{ textAlign: "center" }}>R1</span>
            <span style={{ textAlign: "center" }}>R2</span>
            <span style={{ textAlign: "center" }}>R3</span>
            <span style={{ textAlign: "center" }}>R4</span>
            <span style={{ textAlign: "center" }}>Tot</span>
          </div>

          {/* Rows */}
          {top10.map((s, idx) => (
            <div
              key={s.participant.id}
              style={{
                display: "grid",
                gridTemplateColumns: "36px 1fr 44px 44px 44px 44px 52px",
                padding: "10px 28px",
                borderBottom:
                  idx < top10.length - 1 ? "1px solid #1e1e1e" : "none",
                alignItems: "center",
                fontSize: 13,
                backgroundColor: idx === 0 ? "rgba(242,199,92,0.05)" : "transparent",
              }}
            >
              {/* Rank */}
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "Oswald, sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color:
                    s.rank === 1
                      ? "#f2c75c"
                      : s.rank <= 3
                      ? "#22c55e"
                      : "#a1a1aa",
                }}
              >
                <MedalDot rank={s.rank} />
                {s.rank}
              </span>

              {/* Name */}
              <span
                style={{
                  fontWeight: 600,
                  color: "#f1f5f9",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.participant.name}
              </span>

              {/* Round scores */}
              <span style={{ textAlign: "center" }}>
                <ScoreCell score={s.day1_score} />
              </span>
              <span style={{ textAlign: "center" }}>
                <ScoreCell score={s.day2_score} />
              </span>
              <span style={{ textAlign: "center" }}>
                <ScoreCell score={s.day3_score} />
              </span>
              <span style={{ textAlign: "center" }}>
                <ScoreCell score={s.day4_score} />
              </span>

              {/* Total */}
              <span
                style={{
                  textAlign: "center",
                  fontFamily: "Oswald, sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#f1f5f9",
                }}
              >
                {s.total}
              </span>
            </div>
          ))}

          {standings.length > 10 && (
            <div
              style={{
                padding: "8px 28px",
                fontSize: 11,
                color: "#71717a",
                borderTop: "1px solid #1e1e1e",
                textAlign: "center",
              }}
            >
              +{standings.length - 10} more participants
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              padding: "14px 28px",
              borderTop: "1px solid #1e1e1e",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 10,
              color: "#71717a",
            }}
          >
            <span>masters-pool-app-pi.vercel.app</span>
            <span>
              Powered by{" "}
              <span style={{ fontWeight: 700, color: "#a1a1aa" }}>ESCH</span>
              <span style={{ fontWeight: 700, color: "#22c55e" }}>METRICS</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
