import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// GET: Fetch all participants with their picks for a given year
export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const yearId = req.nextUrl.searchParams.get("year_id");
  if (!yearId) return NextResponse.json({ error: "year_id required" }, { status: 400 });

  const supabase = createServiceClient();

  const { data: participants, error: pErr } = await supabase
    .from("participants")
    .select("id, name, tiebreaker_guess")
    .eq("year_id", yearId)
    .order("name");

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  // Fetch all picks for these participants
  const participantIds = (participants || []).map((p) => p.id);
  if (participantIds.length === 0) return NextResponse.json([]);

  const { data: picks, error: pickErr } = await supabase
    .from("picks")
    .select("id, participant_id, golfer_id")
    .in("participant_id", participantIds);

  if (pickErr) return NextResponse.json({ error: pickErr.message }, { status: 500 });

  // Group picks by participant
  const result = (participants || []).map((p) => ({
    ...p,
    picks: (picks || []).filter((pk) => pk.participant_id === p.id),
  }));

  return NextResponse.json(result);
}

// POST: Update a participant's picks (swap a golfer)
export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { participant_id, old_golfer_id, new_golfer_id } = await req.json();
  if (!participant_id || !old_golfer_id || !new_golfer_id) {
    return NextResponse.json({ error: "participant_id, old_golfer_id, and new_golfer_id required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify the new golfer is in the same tier as the old golfer
  const { data: oldGolfer } = await supabase.from("golfers").select("tier").eq("id", old_golfer_id).single();
  const { data: newGolfer } = await supabase.from("golfers").select("tier").eq("id", new_golfer_id).single();

  if (!oldGolfer || !newGolfer) {
    return NextResponse.json({ error: "Golfer not found" }, { status: 404 });
  }
  if (oldGolfer.tier !== newGolfer.tier) {
    return NextResponse.json({ error: "New golfer must be in the same tier as the old golfer" }, { status: 400 });
  }

  // Check the participant doesn't already have the new golfer picked
  const { data: existingPick } = await supabase
    .from("picks")
    .select("id")
    .eq("participant_id", participant_id)
    .eq("golfer_id", new_golfer_id)
    .single();

  if (existingPick) {
    return NextResponse.json({ error: "Participant already has this golfer picked" }, { status: 409 });
  }

  // Update the pick
  const { error } = await supabase
    .from("picks")
    .update({ golfer_id: new_golfer_id })
    .eq("participant_id", participant_id)
    .eq("golfer_id", old_golfer_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// PUT: Update tiebreaker guess
export async function PUT(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { participant_id, tiebreaker_guess } = await req.json();
  if (!participant_id || tiebreaker_guess === undefined) {
    return NextResponse.json({ error: "participant_id and tiebreaker_guess required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("participants")
    .update({ tiebreaker_guess: Number(tiebreaker_guess) })
    .eq("id", participant_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
