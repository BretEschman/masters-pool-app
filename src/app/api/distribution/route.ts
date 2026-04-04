import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get("year");
  if (!year) return NextResponse.json({ error: "year required" }, { status: 400 });

  const supabase = createServiceClient();

  // Get year record
  const { data: yearData } = await supabase
    .from("years")
    .select("*")
    .eq("year", Number(year))
    .single();

  if (!yearData) return NextResponse.json({ error: "year not found" }, { status: 404 });

  // If picks are still open, don't reveal distribution
  if (yearData.picks_open) {
    return NextResponse.json({ locked: true });
  }

  // Get all golfers for this year
  const { data: golfers } = await supabase
    .from("golfers")
    .select("id, name, tier")
    .eq("year_id", yearData.id);

  if (!golfers) return NextResponse.json({ distribution: [] });

  // Get all participants for this year
  const { data: participants } = await supabase
    .from("participants")
    .select("id")
    .eq("year_id", yearData.id);

  const totalParticipants = participants?.length || 0;

  // Get all picks for these participants
  const participantIds = (participants || []).map((p) => p.id);
  let picks: { golfer_id: string }[] = [];
  if (participantIds.length > 0) {
    const { data: picksData } = await supabase
      .from("picks")
      .select("golfer_id")
      .in("participant_id", participantIds);
    picks = picksData || [];
  }

  // Count picks per golfer
  const pickCounts: Record<string, number> = {};
  for (const pick of picks) {
    pickCounts[pick.golfer_id] = (pickCounts[pick.golfer_id] || 0) + 1;
  }

  // Build distribution data
  const distribution = golfers.map((g) => ({
    name: g.name,
    tier: g.tier,
    pick_count: pickCounts[g.id] || 0,
  }));

  return NextResponse.json({
    locked: false,
    distribution,
    total_participants: totalParticipants,
  });
}
