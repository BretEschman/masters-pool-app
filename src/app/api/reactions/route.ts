import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const ALLOWED_EMOJIS = ["🔥", "💀", "😂", "🏆", "📉", "🫡", "💩", "👑"];

export async function GET(req: NextRequest) {
  const participantId = req.nextUrl.searchParams.get("participant_id");
  const yearId = req.nextUrl.searchParams.get("year_id");

  if (!participantId && !yearId) {
    return NextResponse.json(
      { error: "participant_id or year_id required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  if (participantId) {
    const { data, error } = await supabase
      .from("reactions")
      .select("emoji, reactor_name")
      .eq("participant_id", participantId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.emoji] = (counts[row.emoji] || 0) + 1;
    }

    return NextResponse.json(counts);
  }

  // year_id mode: get all reactions for all participants in this year
  const { data: participants } = await supabase
    .from("participants")
    .select("id")
    .eq("year_id", yearId);

  if (!participants || participants.length === 0) {
    return NextResponse.json({});
  }

  const participantIds = participants.map((p) => p.id);
  const { data, error } = await supabase
    .from("reactions")
    .select("participant_id, emoji, reactor_name")
    .in("participant_id", participantIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by participant_id -> { emoji: { count, reactors[] } }
  const result: Record<
    string,
    Record<string, { count: number; reactors: string[] }>
  > = {};

  for (const row of data || []) {
    if (!result[row.participant_id]) {
      result[row.participant_id] = {};
    }
    if (!result[row.participant_id][row.emoji]) {
      result[row.participant_id][row.emoji] = { count: 0, reactors: [] };
    }
    result[row.participant_id][row.emoji].count += 1;
    result[row.participant_id][row.emoji].reactors.push(row.reactor_name);
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  let body: { participant_id?: string; emoji?: string; reactor_name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { participant_id, emoji, reactor_name } = body;

  if (!participant_id || !emoji || !reactor_name) {
    return NextResponse.json(
      { error: "participant_id, emoji, and reactor_name required" },
      { status: 400 }
    );
  }

  if (!ALLOWED_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Validate that the reactor is a real participant (prevents impersonation)
  const { data: validReactor } = await supabase
    .from("participants")
    .select("id")
    .ilike("name", reactor_name.trim())
    .limit(1)
    .single();

  if (!validReactor) {
    return NextResponse.json({ error: "Reactor must be a registered participant" }, { status: 403 });
  }

  // Check if reaction already exists (toggle behavior)
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("participant_id", participant_id)
    .eq("emoji", emoji)
    .eq("reactor_name", reactor_name)
    .maybeSingle();

  if (existing) {
    // Remove existing reaction
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ action: "removed" });
  }

  // Add new reaction
  const { error } = await supabase
    .from("reactions")
    .insert({ participant_id, emoji, reactor_name });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ action: "added" });
}
