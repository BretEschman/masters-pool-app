"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface LiveGolfer {
  name: string;
  scoreToday: number | null;
  scoreTodayDisplay: string;
  thru: string;
  totalScore: string;
  position: number;
  state: "on_course" | "finished" | "not_started";
  pickCount: number;
}

interface LiveData {
  active: boolean;
  round: number | null;
  golfers: LiveGolfer[];
  projectedCut: number | null;
}

function ScoreBadge({ score, display }: { score: number | null; display: string }) {
  if (score === null) return <span className="text-[var(--text-muted)]">-</span>;
  const color =
    score < 0
      ? "text-green-400"
      : score > 0
      ? "text-red-400"
      : "text-[var(--text-secondary)]";
  return (
    <span className={`${color} font-bold tabular-nums`} style={{ fontFamily: "Oswald, sans-serif" }}>
      {display}
    </span>
  );
}

function PickCountDots({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 ml-2">
      <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded-full border border-[var(--border-medium)]">
        {count} pick{count !== 1 ? "s" : ""}
      </span>
    </span>
  );
}

function GolferCard({ golfer }: { golfer: LiveGolfer }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] shrink-0">
          {golfer.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-[var(--text-primary)] truncate">
              {golfer.name}
            </span>
            <PickCountDots count={golfer.pickCount} />
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            Total: {golfer.totalScore}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <div className="text-lg">
            <ScoreBadge score={golfer.scoreToday} display={golfer.scoreTodayDisplay} />
          </div>
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
            {golfer.state === "on_course"
              ? `Thru ${golfer.thru}`
              : golfer.thru === "F"
              ? "Final"
              : golfer.state === "not_started"
              ? "Not Started"
              : golfer.thru}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LivePage() {
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLive = useCallback((isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    fetch("/api/live")
      .then((r) => r.json())
      .then((d: LiveData) => {
        setData(d);
        setLastRefresh(new Date());
        if (!isRefresh) setLoading(false);
      })
      .catch(() => {
        if (!isRefresh) setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchLive();
  }, [fetchLive]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    function start() {
      stop();
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === "visible") {
          fetchLive(true);
        }
      }, 30000);
    }
    function stop() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    function handleVis() {
      if (document.visibilityState === "visible") {
        fetchLive(true);
        start();
      } else {
        stop();
      }
    }
    start();
    document.addEventListener("visibilitychange", handleVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVis);
    };
  }, [fetchLive]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[var(--em-green-dark)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.active) {
    return (
      <div className="card text-center py-16 px-8">
        <div className="text-4xl mb-4">&#9971;</div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Not Currently Live
        </h2>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          The Masters is not currently in progress. Check back during tournament
          week.
        </p>
      </div>
    );
  }

  const onCourse = data.golfers.filter((g) => g.state === "on_course");
  const finishedOrWaiting = data.golfers.filter((g) => g.state !== "on_course");

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1
            className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            ROUND {data.round} &mdash; LIVE
          </h1>
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--em-green)] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--em-green)]" />
          </span>
        </div>
        {lastRefresh && (
          <span className="text-[10px] text-[var(--text-muted)]">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
        )}
      </div>

      <p className="text-xs text-[var(--text-muted)] mb-4">
        Auto-refreshes every 30 seconds. Showing pool golfers only.
      </p>

      {/* Projected Cut Line */}
      {data.projectedCut !== null && (
        <div className="card mb-6 px-4 py-3 flex items-center justify-between border border-[var(--masters-yellow)]/30 bg-[var(--masters-yellow)]/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--masters-yellow)] uppercase tracking-wider">Projected Cut</span>
            <span className="text-xs text-[var(--text-muted)]">Top 50 + Ties</span>
          </div>
          <span className="text-lg font-bold text-[var(--masters-yellow)]" style={{ fontFamily: "Oswald, sans-serif" }}>
            {data.projectedCut === 0 ? "E" : data.projectedCut > 0 ? `+${data.projectedCut}` : data.projectedCut}
          </span>
        </div>
      )}

      {/* On Course Section */}
      {onCourse.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-[var(--em-green)] uppercase tracking-wider mb-2 px-1">
            On Course ({onCourse.length})
          </h2>
          <div className="card overflow-hidden">
            {onCourse.map((g) => (
              <GolferCard key={g.name} golfer={g} />
            ))}
          </div>
        </div>
      )}

      {/* Finished / Not Started Section */}
      {finishedOrWaiting.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">
            Finished / Not Started ({finishedOrWaiting.length})
          </h2>
          <div className="card overflow-hidden">
            {finishedOrWaiting.map((g) => (
              <GolferCard key={g.name} golfer={g} />
            ))}
          </div>
        </div>
      )}

      {data.golfers.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-[var(--text-secondary)]">
            No pool golfers found in the current ESPN data.
          </p>
        </div>
      )}
    </>
  );
}
