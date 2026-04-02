import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { calculateStandings } from "@/lib/scoring";
import { Golfer, Participant } from "@/lib/types";

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get("year");
  if (!year) return NextResponse.json({ error: "year required" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: yearData } = await supabase.from("years").select("*").eq("year", Number(year)).single();
  if (!yearData) return NextResponse.json({ standings: [], winning_score: null });

  const { data: golfers } = await supabase.from("golfers").select("*").eq("year_id", yearData.id);
  const { data: participants } = await supabase.from("participants").select("*").eq("year_id", yearData.id);
  if (!participants || !golfers) return NextResponse.json({ standings: [], winning_score: null });

  const participantIds = participants.map((p) => p.id);
  const { data: picks } = await supabase.from("picks").select("participant_id, golfer_id").in("participant_id", participantIds);

  const golferMap = new Map(golfers.map((g) => [g.id, g]));
  const golfersByParticipant: Record<string, Golfer[]> = {};
  for (const p of participants) {
    golfersByParticipant[p.id] = (picks || [])
      .filter((pick) => pick.participant_id === p.id)
      .map((pick) => golferMap.get(pick.golfer_id))
      .filter(Boolean) as Golfer[];
  }

  const standings = calculateStandings(participants as Participant[], golfersByParticipant, yearData.winning_score);
  return NextResponse.json({ standings, winning_score: yearData.winning_score });
}
