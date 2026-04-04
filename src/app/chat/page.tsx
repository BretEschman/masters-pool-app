"use client";

import { useState, useEffect, useCallback } from "react";

interface Message {
  id: string;
  year_id: string;
  author: string;
  body: string;
  created_at: string;
}

interface YearInfo {
  id: string;
  year: number;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [yearInfo, setYearInfo] = useState<YearInfo | null>(null);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load current year info
  useEffect(() => {
    fetch("/api/years")
      .then((r) => r.json())
      .then((years: YearInfo[]) => {
        const currentYear = new Date().getFullYear();
        const match = years.find((y) => y.year === currentYear);
        if (match) setYearInfo(match);
      })
      .catch(() => {});

    // Restore author from sessionStorage
    try {
      const saved = sessionStorage.getItem("pool_name");
      if (saved) setAuthor(saved);
    } catch {
      // sessionStorage not available
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!yearInfo) return;
    try {
      const res = await fetch(`/api/messages?year_id=${yearInfo.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch {
      // silent fail on refresh
    } finally {
      setLoading(false);
    }
  }, [yearInfo]);

  // Initial load + auto-refresh every 15 seconds
  useEffect(() => {
    if (!yearInfo) return;
    loadMessages();
    const interval = setInterval(loadMessages, 15000);
    return () => clearInterval(interval);
  }, [yearInfo, loadMessages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim() || !body.trim() || !yearInfo) return;

    setSending(true);
    setError("");

    try {
      // Save author name
      try {
        sessionStorage.setItem("pool_name", author.trim());
      } catch {
        // ignore
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year_id: yearInfo.id,
          author: author.trim(),
          body: body.trim(),
        }),
      });

      if (res.ok) {
        setBody("");
        loadMessages();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send message");
      }
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (!yearInfo && !loading) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--text-muted)]">No active year found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1
        className="text-2xl font-bold text-[var(--text-primary)] mb-6"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        Trash Talk
      </h1>

      {/* Post form */}
      <form onSubmit={sendMessage} className="card p-4 mb-6">
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name"
            maxLength={50}
            className="w-40 shrink-0 bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--em-green-dark)] transition-colors"
          />
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Talk your trash..."
            maxLength={500}
            className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--em-green-dark)] transition-colors"
          />
          <button
            type="submit"
            disabled={sending || !author.trim() || !body.trim()}
            className="shrink-0 bg-[var(--em-green-dark)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--em-green)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}
        <p className="text-xs text-[var(--text-muted)]">
          {body.length}/500
        </p>
      </form>

      {/* Messages */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--em-green)]/30 border-t-[var(--em-green)] rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-muted)]">
            No messages yet. Be the first to talk some trash!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="card p-4">
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-semibold text-sm text-[var(--em-green)]">
                  {msg.author}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {relativeTime(msg.created_at)}
                </span>
              </div>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                {msg.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
