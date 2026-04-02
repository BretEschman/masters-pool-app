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
        <a href="/picks" className="bg-[var(--masters-yellow)] text-[var(--masters-dark)] px-4 py-2 rounded font-bold hover:opacity-90">
          Submit Picks
        </a>
      </div>
      {loading ? (
        <p className="text-center py-12 text-gray-500">Loading standings...</p>
      ) : standings.length === 0 ? (
        <p className="text-center py-12 text-gray-500">No entries yet for {selectedYear}.</p>
      ) : (
        <Leaderboard standings={standings} winningScore={winningScore} />
      )}
    </AccessGate>
  );
}
