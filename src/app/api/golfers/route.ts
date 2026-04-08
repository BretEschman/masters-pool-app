import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get("year");
  if (!year) return NextResponse.json({ error: "year required" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: yearData } = await supabase.from("years").select("*").eq("year", Number(year)).single();
  if (!yearData) return NextResponse.json({ error: "Year not found" }, { status: 404 });

  // Order by tier, then by created_at — golfers are uploaded in odds order,
  // so insertion order preserves odds ranking within each tier.
  const { data: golfers } = await supabase
    .from("golfers")
    .select("*")
    .eq("year_id", yearData.id)
    .order("tier")
    .order("created_at");
  return NextResponse.json({ golfers: golfers || [], picks_open: yearData.picks_open, year_id: yearData.id });
}
