"use client";

import { useState, useEffect } from "react";

interface PayoutData {
  year: number;
  participantCount: number;
  entryFee: number;
  totalPrizePool: number;
  payoutConfig: Record<string, number>;
}

const placeLabels: Record<string, string> = {
  "1": "1st Place",
  "2": "2nd Place",
  "3": "3rd Place",
  "4": "4th Place",
  "5": "5th Place",
};

export default function PayoutsPage() {
  const [data, setData] = useState<PayoutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const year = new Date().getFullYear();
    fetch(`/api/payouts?year=${year}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setData(null);
        else setData(d);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-[var(--em-green)]/30 border-t-[var(--em-green)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--text-muted)]">No payout data available for this year.</p>
      </div>
    );
  }

  const sortedPlaces = Object.keys(data.payoutConfig).sort(
    (a, b) => Number(a) - Number(b)
  );

  return (
    <div className="max-w-xl mx-auto">
      <h1
        className="text-2xl font-bold text-[var(--text-primary)] mb-6"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {data.year} Payouts
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5 text-center">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Entries
          </p>
          <p
            className="text-3xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            {data.participantCount}
          </p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Prize Pool
          </p>
          <p
            className="text-3xl font-bold text-[var(--em-green)]"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            ${data.totalPrizePool.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Payout breakdown */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Place
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Percentage
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPlaces.map((place) => {
              const pct = data.payoutConfig[place];
              const amount = Math.round((data.totalPrizePool * pct) / 100);
              return (
                <tr
                  key={place}
                  className="border-b border-[var(--border-subtle)] last:border-0"
                >
                  <td className="px-5 py-4 text-[var(--text-primary)] font-semibold">
                    {placeLabels[place] || `${place}th Place`}
                  </td>
                  <td className="px-5 py-4 text-center text-[var(--text-secondary)]">
                    {pct}%
                  </td>
                  <td
                    className="px-5 py-4 text-right font-bold text-[var(--em-green)]"
                    style={{ fontFamily: "Oswald, sans-serif" }}
                  >
                    ${amount.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--text-muted)] mt-4 text-center">
        Based on ${data.entryFee} entry fee &times; {data.participantCount} entries
      </p>
    </div>
  );
}
