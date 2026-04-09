import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { year, access_code, entry_fee, picks_open } = await req.json();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("years")
    .upsert({ year, access_code, entry_fee: entry_fee || 25, picks_open: picks_open ?? true }, { onConflict: "year" })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH: Toggle picks_open without needing access_code
export async function PATCH(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { year, picks_open } = await req.json();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("years")
    .update({ picks_open })
    .eq("year", year)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
