import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { name, tiebreaker_guess, golfer_ids, year_id, access_code } = await req.json();
  if (!name || tiebreaker_guess === undefined || !golfer_ids || golfer_ids.length !== 8 || !year_id || !access_code) {
    return NextResponse.json({ error: "Name, tiebreaker guess, year_id, access code, and exactly 8 golfer picks required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify access code
  const { data: yearData } = await supabase.from("years").select("picks_open, access_code").eq("id", year_id).single();
  if (!yearData || yearData.access_code !== access_code) {
    return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
  }
  if (!yearData.picks_open) return NextResponse.json({ error: "Picks are closed for this year" }, { status: 403 });

  const { data: golfers } = await supabase.from("golfers").select("id, tier").in("id", golfer_ids);
  if (!golfers || golfers.length !== 8) return NextResponse.json({ error: "Invalid golfer selections" }, { status: 400 });

  const tierCounts: Record<number, number> = {};
  golfers.forEach((g) => (tierCounts[g.tier] = (tierCounts[g.tier] || 0) + 1));
  const expectedCounts: Record<number, number> = { 1: 2, 2: 2, 3: 1, 4: 1, 5: 1, 6: 1 };
  const valid = Object.entries(expectedCounts).every(([tier, count]) => (tierCounts[Number(tier)] || 0) === count);
  if (!valid) {
    return NextResponse.json({ error: "Must pick 2 from Tier 1, 2 from Tier 2, 1 from each of Tiers 3-6" }, { status: 400 });
  }

  const { data: existing } = await supabase.from("participants").select("id").eq("year_id", year_id).eq("name", name).single();
  if (existing) return NextResponse.json({ error: "A participant with this name already exists" }, { status: 409 });

  const { data: participant, error: pError } = await supabase
    .from("participants").insert({ name, tiebreaker_guess: Number(tiebreaker_guess), year_id }).select().single();
  if (pError) return NextResponse.json({ error: pError.message }, { status: 500 });

  const pickRows = golfer_ids.map((gid: string) => ({ participant_id: participant.id, golfer_id: gid }));
  const { error: pickError } = await supabase.from("picks").insert(pickRows);
  if (pickError) return NextResponse.json({ error: pickError.message }, { status: 500 });

  return NextResponse.json({ ok: true, participant_id: participant.id });
}
