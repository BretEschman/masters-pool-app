"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const EMOJIS = ["🔥", "💀", "😂", "🏆", "📉", "🫡", "💩", "👑"];

export interface ReactionData {
  count: number;
  reactors: string[];
}

interface Props {
  participantId: string;
  reactions: Record<string, ReactionData>;
  onToggle: (participantId: string, emoji: string) => Promise<void>;
}

export default function Reactions({ participantId, reactions, onToggle }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const poolName =
    typeof window !== "undefined"
      ? sessionStorage.getItem("pool_name")
      : null;

  // Close picker when clicking outside
  useEffect(() => {
    if (!showPicker) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPicker]);

  const handleClick = useCallback(
    async (e: React.MouseEvent, emoji: string) => {
      e.stopPropagation();
      if (!poolName) {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 2500);
        return;
      }
      if (loading) return;
      setLoading(emoji);
      try {
        await onToggle(participantId, emoji);
      } finally {
        setLoading(null);
      }
    },
    [participantId, poolName, loading, onToggle]
  );

  // Get only emojis that have reactions
  const activeEmojis = EMOJIS.filter((e) => reactions[e]?.count > 0);

  return (
    <div className="relative flex items-center gap-1 px-4 pb-2 pt-0.5" ref={pickerRef}>
      {showTooltip && (
        <div className="absolute -top-7 left-4 bg-[var(--bg-surface)] text-[var(--text-secondary)] text-[10px] px-2 py-1 rounded shadow-lg border border-[var(--border-medium)] whitespace-nowrap z-10">
          Enter your name on the home page first
        </div>
      )}

      {/* Show only emojis with reactions */}
      {activeEmojis.map((emoji) => {
        const data = reactions[emoji];
        const isActive = poolName ? data?.reactors?.includes(poolName) : false;
        const isLoading = loading === emoji;
        return (
          <button
            key={emoji}
            onClick={(e) => handleClick(e, emoji)}
            disabled={isLoading}
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 transition-all duration-150 select-none ${
              isActive
                ? "bg-[var(--em-green)]/15 border border-[var(--em-green)]/50"
                : "bg-[var(--bg-surface)] border border-transparent hover:border-[var(--border-medium)]"
            } ${isLoading ? "opacity-50" : ""}`}
            style={{ height: "24px", fontSize: "13px", lineHeight: "24px" }}
          >
            <span>{emoji}</span>
            <span className={`text-[11px] tabular-nums ${isActive ? "text-[var(--em-green)]" : "text-[var(--text-muted)]"}`}>
              {data.count}
            </span>
          </button>
        );
      })}

      {/* Add reaction button */}
      <button
        onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
        className="inline-flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-transparent hover:border-[var(--border-medium)] transition-all select-none text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        style={{ height: "24px", width: "24px", fontSize: "13px", lineHeight: "24px" }}
      >
        +
      </button>

      {/* Emoji picker dropdown */}
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-1 flex gap-1 bg-[var(--bg-card)] border border-[var(--border-medium)] rounded-lg p-1.5 shadow-lg z-20">
          {EMOJIS.map((emoji) => {
            const isActive = poolName ? reactions[emoji]?.reactors?.includes(poolName) : false;
            const isLoading = loading === emoji;
            return (
              <button
                key={emoji}
                onClick={(e) => { handleClick(e, emoji); setShowPicker(false); }}
                disabled={isLoading}
                className={`rounded-md p-1 transition-all hover:bg-[var(--bg-surface)] ${
                  isActive ? "bg-[var(--em-green)]/15 ring-1 ring-[var(--em-green)]/50" : ""
                } ${isLoading ? "opacity-50" : ""}`}
                style={{ fontSize: "18px" }}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
