"use client";

import { useEffect, useState } from "react";
import AccessGate from "@/components/AccessGate";
import YearSelector from "@/components/YearSelector";
import Leaderboard from "@/components/Leaderboard";
import { Year, ParticipantStanding } from "@/lib/types";

export default function Home() {
  const [years, setYears] = useState<Year[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [standings, setStandings] = useState<ParticipantStanding[]>([]);
  const [winningScore, setWinningScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/years")
      .then((r) => r.json())
      .then((data) => {
        setYears(data);
        if (data.length > 0) setSelectedYear(data[0].year);
      });
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    setLoading(true);
    fetch(`/api/standings?year=${selectedYear}`)
      .then((r) => r.json())
      .then((data) => {
        setStandings(data.standings);
        setWinningScore(data.winning_score);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedYear]);

  return (
    <AccessGate>
      <div className="flex items-center justify-between mb-6">
        <YearSelector years={years} selectedYear={selectedYear} onChange={setSelectedYear} />
        <a
          href="/picks"
          className="bg-[var(--masters-yellow)] text-[var(--bg-primary)] px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity glow-yellow"
        >
          Submit Picks
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--masters-green)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : standings.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-[var(--text-secondary)] text-lg">No entries yet for {selectedYear}.</p>
          <p className="text-[var(--text-muted)] text-sm mt-2">Submit your picks to get started!</p>
        </div>
      ) : (
        <Leaderboard standings={standings} winningScore={winningScore} />
      )}
    </AccessGate>
  );
}
