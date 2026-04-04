"use client";

import { useState, useCallback } from "react";

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
  const [showTooltip, setShowTooltip] = useState(false);

  const poolName =
    typeof window !== "undefined"
      ? sessionStorage.getItem("pool_name")
      : null;

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

  return (
    <div className="relative flex flex-wrap items-center gap-1 px-4 pb-2 pt-0.5">
      {showTooltip && (
        <div className="absolute -top-7 left-4 bg-[var(--bg-surface)] text-[var(--text-secondary)] text-[10px] px-2 py-1 rounded shadow-lg border border-[var(--border-medium)] whitespace-nowrap z-10">
          Enter your name on the home page first
        </div>
      )}
      {EMOJIS.map((emoji) => {
        const data = reactions[emoji];
        const count = data?.count || 0;
        const isActive = poolName
          ? data?.reactors?.includes(poolName)
          : false;
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
            {count > 0 && (
              <span
                className={`text-[11px] tabular-nums ${
                  isActive
                    ? "text-[var(--em-green)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
