import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { golfer_id, day1_score, day2_score, day3_score, day4_score, status } = await req.json();
  const supabase = createServiceClient();
  const updates: Record<string, unknown> = {};
  if (day1_score !== undefined) updates.day1_score = day1_score;
  if (day2_score !== undefined) updates.day2_score = day2_score;
  if (day3_score !== undefined) updates.day3_score = day3_score;
  if (day4_score !== undefined) updates.day4_score = day4_score;
  if (status !== undefined) updates.status = status;
  const { data, error } = await supabase.from("golfers").update(updates).eq("id", golfer_id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
