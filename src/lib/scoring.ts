import { Golfer, Participant, ParticipantStanding } from "./types";

export function getEffectiveScore(golfer: Golfer, day: number): number | null {
  const dayKey = `day${day}_score` as keyof Golfer;
  const actualScore = golfer[dayKey] as number | null;

  if (golfer.status === "active") return actualScore;

  if (actualScore !== null) return actualScore;

  for (let d = 1; d < day; d++) {
    const prevKey = `day${d}_score` as keyof Golfer;
    if (golfer[prevKey] !== null) return 10;
  }

  if (golfer.status === "wd") return 10;
  if (golfer.status === "cut" && day >= 3) return 10;

  return actualScore;
}

export function calculateDayScore(golfers: Golfer[], day: number): number {
  const scores = golfers
    .map((g) => getEffectiveScore(g, day))
    .filter((s): s is number => s !== null);
  if (scores.length === 0) return 0;
  scores.sort((a, b) => a - b);
  return scores.slice(0, 4).reduce((sum, s) => sum + s, 0);
}

export function calculateStandings(
  participants: Participant[],
  golfersByParticipant: Record<string, Golfer[]>,
  winningScore: number | null
): ParticipantStanding[] {
  const standings: ParticipantStanding[] = participants.map((p) => {
    const golfers = golfersByParticipant[p.id] || [];
    const day1 = calculateDayScore(golfers, 1);
    const day2 = calculateDayScore(golfers, 2);
    const day3 = calculateDayScore(golfers, 3);
    const day4 = calculateDayScore(golfers, 4);
    return {
      participant: p, golfers,
      day1_score: day1, day2_score: day2, day3_score: day3, day4_score: day4,
      total: day1 + day2 + day3 + day4,
      rank: 0,
      tiebreaker_diff: winningScore !== null ? Math.abs(p.tiebreaker_guess - winningScore) : null,
    };
  });

  standings.sort((a, b) => {
    if (a.total !== b.total) return a.total - b.total;
    if (a.tiebreaker_diff !== null && b.tiebreaker_diff !== null) return a.tiebreaker_diff - b.tiebreaker_diff;
    return 0;
  });

  standings.forEach((s, i) => {
    if (i === 0) { s.rank = 1; }
    else {
      const prev = standings[i - 1];
      s.rank = s.total === prev.total && s.tiebreaker_diff === prev.tiebreaker_diff ? prev.rank : i + 1;
    }
  });

  return standings;
}
