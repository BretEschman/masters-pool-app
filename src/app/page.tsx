"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import AccessGate from "@/components/AccessGate";
import YearSelector from "@/components/YearSelector";
import Leaderboard from "@/components/Leaderboard";
import { AllReactions } from "@/components/Leaderboard";
import GolferLeaderboard from "@/components/GolferLeaderboard";
import { Year, ParticipantStanding, Golfer } from "@/lib/types";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function Home() {
  const [years, setYears] = useState<Year[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [standings, setStandings] = useState<ParticipantStanding[]>([]);
  const [winningScore, setWinningScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<"pool" | "golfers">("pool");
  const [allGolfers, setAllGolfers] = useState<Golfer[]>([]);
  const [golfersLoading, setGolfersLoading] = useState(false);
  const [reactions, setReactions] = useState<AllReactions>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/years")
      .then((r) => r.json())
      .then((data) => {
        setYears(data);
        if (data.length > 0) setSelectedYear(data[0].year);
      });
  }, []);

  const fetchStandings = useCallback((year: number, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    fetch(`/api/standings?year=${year}`)
      .then((r) => r.json())
      .then((data) => {
        setStandings(data.standings);
        setWinningScore(data.winning_score);
        setLastUpdated(new Date());
        if (!isRefresh) setLoading(false);
      })
      .catch(() => { if (!isRefresh) setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    fetchStandings(selectedYear);
  }, [selectedYear, fetchStandings]);

  // Auto-refresh every 60 seconds when page is visible
  useEffect(() => {
    if (!selectedYear) return;

    function startInterval() {
      stopInterval();
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === "visible") {
          fetchStandings(selectedYear, true);
        }
      }, 60000);
    }

    function stopInterval() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        // Refresh immediately when tab becomes visible again
        fetchStandings(selectedYear, true);
        startInterval();
      } else {
        stopInterval();
      }
    }

    startInterval();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [selectedYear, fetchStandings]);

  // Fetch golfers when golfer tab is active
  useEffect(() => {
    if (activeTab !== "golfers" || !selectedYear) return;
    setGolfersLoading(true);
    fetch(`/api/golfers?year=${selectedYear}`)
      .then((r) => r.json())
      .then((data) => {
        setAllGolfers(data.golfers || []);
        setGolfersLoading(false);
      })
      .catch(() => setGolfersLoading(false));
  }, [activeTab, selectedYear]);

  // Fetch reactions when standings load
  const fetchReactions = useCallback((yearId: string) => {
    fetch(`/api/reactions?year_id=${yearId}`)
      .then((r) => r.json())
      .then((data) => setReactions(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedYear || standings.length === 0) return;
    const yearObj = years.find((y) => y.year === selectedYear);
    if (yearObj) fetchReactions(yearObj.id);
  }, [selectedYear, standings, years, fetchReactions]);

  const handleToggleReaction = useCallback(async (participantId: string, emoji: string) => {
    const poolName = sessionStorage.getItem("pool_name");
    if (!poolName) return;

    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_id: participantId, emoji, reactor_name: poolName }),
    });
    const result = await res.json();

    // Optimistically update local state
    setReactions((prev) => {
      const updated = { ...prev };
      const participantReactions = { ...(updated[participantId] || {}) };
      const emojiData = participantReactions[emoji]
        ? { ...participantReactions[emoji] }
        : { count: 0, reactors: [] };

      if (result.action === "added") {
        emojiData.count += 1;
        emojiData.reactors = [...emojiData.reactors, poolName];
      } else if (result.action === "removed") {
        emojiData.count = Math.max(0, emojiData.count - 1);
        emojiData.reactors = emojiData.reactors.filter((r) => r !== poolName);
      }

      participantReactions[emoji] = emojiData;
      updated[participantId] = participantReactions;
      return updated;
    });
  }, []);

  // Tick every 15s to keep "last updated" text fresh
  useEffect(() => {
    tickRef.current = setInterval(() => setTick((t) => t + 1), 15000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  return (
    <AccessGate>
      {(paid) => (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <YearSelector years={years} selectedYear={selectedYear} onChange={setSelectedYear} />
              <a
                href={`/share?year=${selectedYear}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-[var(--border-medium)] hover:border-[var(--em-green)] text-[var(--text-muted)] hover:text-[var(--em-green)] transition-colors"
                title="Share leaderboard"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </a>
            </div>
            <a
              href="/picks"
              className="bg-[var(--masters-yellow)] text-[var(--bg-primary)] px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity glow-yellow"
            >
              Submit Picks
            </a>
          </div>

          {lastUpdated && paid && (
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Last updated {timeAgo(lastUpdated)}
            </p>
          )}

          {/* Tab Toggle */}
          {paid && !loading && standings.length > 0 && (
            <div className="flex gap-1 mb-4 bg-[var(--bg-card)] rounded-xl p-1 border border-[var(--border-medium)]">
              <button
                onClick={() => setActiveTab("pool")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === "pool"
                    ? "bg-[var(--em-green-dark)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Pool Standings
              </button>
              <button
                onClick={() => setActiveTab("golfers")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === "golfers"
                    ? "bg-[var(--em-green-dark)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Golfer Board
              </button>
            </div>
          )}

          {!paid ? (
            <div className="card text-center py-16 px-8">
              <div className="text-4xl mb-4">&#9971;</div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Pay to View Leaderboard</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                You need to pay your $25 entry fee to see the standings.
              </p>
              <a
                href="/pay"
                className="inline-block bg-[#008CFF] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#0074D4] transition-colors"
              >
                Pay $25 via Venmo
              </a>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[var(--em-green-dark)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : standings.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-[var(--text-secondary)] text-lg">No entries yet for {selectedYear}.</p>
              <p className="text-[var(--text-muted)] text-sm mt-2">Submit your picks to get started!</p>
            </div>
          ) : (
            activeTab === "pool" ? (
              <Leaderboard standings={standings} winningScore={winningScore} reactions={reactions} onToggleReaction={handleToggleReaction} />
            ) : golfersLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[var(--em-green-dark)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <GolferLeaderboard golfers={allGolfers} />
            )
          )}

          {/* Buy the dev a beer */}
          {paid && !loading && standings.length > 0 && (
            <div className="text-center mt-8">
              <a
                href="https://venmo.com/u/BretEschman?txn=pay&amount=5&note=Beer%20for%20the%20dev%20🍺"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-medium)] hover:border-[var(--masters-yellow)] transition-colors group"
              >
                <span className="text-3xl group-hover:animate-bounce">🍺</span>
                <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--masters-yellow)] transition-colors">
                  Buy the developer a beer
                </span>
              </a>
            </div>
          )}
        </>
      )}
    </AccessGate>
  );
}
