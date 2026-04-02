"use client";

import { ParticipantStanding } from "@/lib/types";
import { useState } from "react";

interface Props {
  standings: ParticipantStanding[];
  winningScore: number | null;
}

export default function Leaderboard({ standings, winningScore }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--masters-green)] text-white">
            <tr>
              <th className="px-3 py-3 text-left text-sm">Rank</th>
              <th className="px-3 py-3 text-left text-sm">Name</th>
              <th className="px-3 py-3 text-center text-sm">R1</th>
              <th className="px-3 py-3 text-center text-sm">R2</th>
              <th className="px-3 py-3 text-center text-sm">R3</th>
              <th className="px-3 py-3 text-center text-sm">R4</th>
              <th className="px-3 py-3 text-center text-sm font-bold">Total</th>
              <th className="px-3 py-3 text-center text-sm">TB</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s) => (
              <tr key={s.participant.id}>
                <td
                  colSpan={8}
                  className="p-0"
                >
                  <div
                    className="grid grid-cols-[auto_1fr_repeat(6,auto)] items-center border-b hover:bg-green-50 cursor-pointer px-3 py-2"
                    onClick={() => setExpandedId(expandedId === s.participant.id ? null : s.participant.id)}
                  >
                    <span className="font-bold text-[var(--masters-green)] pr-3">{s.rank}</span>
                    <span className="font-medium">
                      {s.participant.name}
                      {s.participant.paid && <span className="ml-1 text-green-600 text-xs">$</span>}
                    </span>
                    <span className="text-center px-3">{s.day1_score}</span>
                    <span className="text-center px-3">{s.day2_score}</span>
                    <span className="text-center px-3">{s.day3_score}</span>
                    <span className="text-center px-3">{s.day4_score}</span>
                    <span className="text-center px-3 font-bold">{s.total}</span>
                    <span className="text-center px-3 text-sm text-gray-600">{s.participant.tiebreaker_guess}</span>
                  </div>
                  {expandedId === s.participant.id && (
                    <div className="bg-green-50 px-6 py-3 border-b">
                      <div className="text-sm">
                        <h4 className="font-bold mb-2">Golfer Picks</h4>
                        <table className="w-full">
                          <thead>
                            <tr className="text-gray-600">
                              <th className="text-left py-1">Golfer</th>
                              <th className="text-center py-1">Tier</th>
                              <th className="text-center py-1">R1</th>
                              <th className="text-center py-1">R2</th>
                              <th className="text-center py-1">R3</th>
                              <th className="text-center py-1">R4</th>
                              <th className="text-center py-1">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.golfers.sort((a, b) => a.tier - b.tier).map((g) => (
                              <tr key={g.id} className="border-t border-green-200">
                                <td className="py-1">{g.name}</td>
                                <td className="text-center">{g.tier}</td>
                                <td className="text-center">{g.day1_score ?? "-"}</td>
                                <td className="text-center">{g.day2_score ?? "-"}</td>
                                <td className="text-center">{g.day3_score ?? "-"}</td>
                                <td className="text-center">{g.day4_score ?? "-"}</td>
                                <td className="text-center">
                                  {g.status !== "active" && (
                                    <span className="text-red-600 font-bold">{g.status.toUpperCase()}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
