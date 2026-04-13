import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { calculateStandings } from "@/lib/scoring";
import { Golfer, Participant } from "@/lib/types";

interface YearResult {
  year: number;
  rank: number;
  total: number;
}

interface ParticipantHistory {
  name: string;
  years_played: number;
  results: YearResult[];
  best_finish: number;
  average_finish: number;
  wins: number;
}

// Normalize names so the same person across years gets combined
const NAME_MAP: Record<string, string> = {
  "Dave H": "David Holloway",
  "Rook": "Rook McClain",
  "Rook 1": "Rook McClain",
  "Rook 2": "Rook McClain",
  "Rook 1 ": "Rook McClain",
  "Rook 2 ": "Rook McClain",
  "Mike V 1": "Mikey V",
  "Mike V 2": "Mikey V",
  "Mike V": "Mikey V",
  "G-Baby Pedley": "Grant Pedley",
  "Nick Horvat 1": "Nicholas Horvat",
  "Nick Horvat 2": "Nicholas Horvat",
  "Nicholas Horvat": "Nicholas Horvat",
  "Boof Eschman": "Ruth Eschman",
  "Rat": "Josh Raterman",
  "Rat Josherman": "Josh Raterman",
  "Krause 1": "Greg Krause",
  "Krause 2": "Greg Krause",
  "AlexK": "Alex Keel",
  "Alex K": "Alex Keel",
  "Shooter": "Paul Buxton",
};

function normalizeName(name: string): string {
  const trimmed = name.trim();
  return NAME_MAP[trimmed] || trimmed;
}

export async function GET() {
  const supabase = createServiceClient();

  // Get all years
  const { data: years } = await supabase
    .from("years")
    .select("*")
    .order("year", { ascending: true });

  if (!years || years.length === 0) {
    return NextResponse.json({
      participants: [],
      records: { best_score: null, most_wins: null, most_appearances: null },
      year_results: [],
    });
  }

  // For each year, compute standings
  const allParticipantResults: Record<string, YearResult[]> = {};
  const yearResults: { year: number; winner: string; winning_total: number }[] = [];

  // Batch fetch all data upfront (avoid N+1)
  const yearIds = years.map((y) => y.id);
  const [allGolfersRes, allParticipantsRes, allPicksRes] = await Promise.all([
    supabase.from("golfers").select("*").in("year_id", yearIds),
    supabase.from("participants").select("*").in("year_id", yearIds),
    supabase.from("picks").select("participant_id, golfer_id"),
  ]);
  const allGolfers = allGolfersRes.data || [];
  const allParticipants = allParticipantsRes.data || [];
  const allPicks = allPicksRes.data || [];

  // Group by year_id
  const golfersByYear = new Map<string, typeof allGolfers>();
  const participantsByYear = new Map<string, typeof allParticipants>();
  for (const g of allGolfers) {
    if (!golfersByYear.has(g.year_id)) golfersByYear.set(g.year_id, []);
    golfersByYear.get(g.year_id)!.push(g);
  }
  for (const p of allParticipants) {
    if (!participantsByYear.has(p.year_id)) participantsByYear.set(p.year_id, []);
    participantsByYear.get(p.year_id)!.push(p);
  }

  // Build participant ID set for filtering picks
  const participantIdSet = new Set(allParticipants.map((p) => p.id));
  const picksByParticipant = new Map<string, typeof allPicks>();
  for (const pick of allPicks) {
    if (!participantIdSet.has(pick.participant_id)) continue;
    if (!picksByParticipant.has(pick.participant_id)) picksByParticipant.set(pick.participant_id, []);
    picksByParticipant.get(pick.participant_id)!.push(pick);
  }

  for (const yearData of years) {
    const golfers = golfersByYear.get(yearData.id) || [];
    const participants = participantsByYear.get(yearData.id) || [];

    if (participants.length === 0 || golfers.length === 0) continue;

    const golferMap = new Map(golfers.map((g) => [g.id, g]));
    const golfersByParticipantMap: Record<string, Golfer[]> = {};
    for (const p of participants) {
      const pPicks = picksByParticipant.get(p.id) || [];
      golfersByParticipantMap[p.id] = pPicks
        .map((pick) => golferMap.get(pick.golfer_id))
        .filter(Boolean) as Golfer[];
    }

    const standings = calculateStandings(
      participants as Participant[],
      golfersByParticipantMap,
      yearData.winning_score
    );

    // Record each participant's result (with name normalization)
    for (const s of standings) {
      const name = normalizeName(s.participant.name);
      if (!allParticipantResults[name]) {
        allParticipantResults[name] = [];
      }
      allParticipantResults[name].push({
        year: yearData.year,
        rank: s.rank,
        total: s.total,
      });
    }

    // Record year winner
    if (standings.length > 0) {
      const winner = standings[0];
      yearResults.push({
        year: yearData.year,
        winner: normalizeName(winner.participant.name),
        winning_total: winner.total,
      });
    }
  }

  // Build participant histories
  const participants: ParticipantHistory[] = Object.entries(allParticipantResults).map(
    ([name, results]) => {
      const bestFinish = Math.min(...results.map((r) => r.rank));
      const avgFinish = results.reduce((sum, r) => sum + r.rank, 0) / results.length;
      const wins = results.filter((r) => r.rank === 1).length;

      return {
        name,
        years_played: results.length,
        results,
        best_finish: bestFinish,
        average_finish: Math.round(avgFinish * 10) / 10,
        wins,
      };
    }
  );

  // Sort by best finish, then average
  participants.sort((a, b) => {
    if (a.best_finish !== b.best_finish) return a.best_finish - b.best_finish;
    return a.average_finish - b.average_finish;
  });

  // Records
  let bestScore: { name: string; year: number; score: number } | null = null;
  for (const [name, results] of Object.entries(allParticipantResults)) {
    for (const r of results) {
      if (!bestScore || r.total < bestScore.score) {
        bestScore = { name, year: r.year, score: r.total };
      }
    }
  }

  const mostWins = participants.reduce(
    (best, p) => (p.wins > (best?.wins || 0) ? p : best),
    null as ParticipantHistory | null
  );

  const mostAppearances = participants.reduce(
    (best, p) => (p.years_played > (best?.years_played || 0) ? p : best),
    null as ParticipantHistory | null
  );

  return NextResponse.json({
    participants,
    records: {
      best_score: bestScore,
      most_wins: mostWins
        ? { name: mostWins.name, wins: mostWins.wins }
        : null,
      most_appearances: mostAppearances
        ? { name: mostAppearances.name, count: mostAppearances.years_played }
        : null,
    },
    year_results: yearResults,
  });
}
