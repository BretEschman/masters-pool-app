import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { name, tiebreaker_guess, golfer_ids, year_id } = await req.json();
  if (!name || tiebreaker_guess === undefined || !golfer_ids || golfer_ids.length !== 8 || !year_id) {
    return NextResponse.json({ error: "Name, tiebreaker guess, year_id, and exactly 8 golfer picks required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: yearData } = await supabase.from("years").select("picks_open").eq("id", year_id).single();
  if (!yearData?.picks_open) return NextResponse.json({ error: "Picks are closed for this year" }, { status: 403 });

  const { data: golfers } = await supabase.from("golfers").select("id, tier").in("id", golfer_ids);
  if (!golfers || golfers.length !== 8) return NextResponse.json({ error: "Invalid golfer selections" }, { status: 400 });

  const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  golfers.forEach((g) => (tierCounts[g.tier] = (tierCounts[g.tier] || 0) + 1));
  if (tierCounts[1] !== 3 || tierCounts[2] !== 2 || tierCounts[3] !== 2 || tierCounts[4] !== 1) {
    return NextResponse.json({ error: "Must pick 3 from Tier 1, 2 from Tier 2, 2 from Tier 3, 1 from Tier 4" }, { status: 400 });
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
