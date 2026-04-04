import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const DEFAULT_PAYOUT: Record<string, number> = { "1": 60, "2": 30, "3": 10 };

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get("year");
  if (!year) return NextResponse.json({ error: "year required" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: yearData, error: yearErr } = await supabase
    .from("years")
    .select("id, year, entry_fee, payout_config")
    .eq("year", Number(year))
    .single();

  if (yearErr || !yearData)
    return NextResponse.json({ error: "Year not found" }, { status: 404 });

  const { count } = await supabase
    .from("participants")
    .select("id", { count: "exact", head: true })
    .eq("year_id", yearData.id);

  const participantCount = count ?? 0;
  const entryFee = yearData.entry_fee || 25;
  const payoutConfig = yearData.payout_config || DEFAULT_PAYOUT;

  return NextResponse.json({
    year: yearData.year,
    participantCount,
    entryFee,
    totalPrizePool: participantCount * entryFee,
    payoutConfig,
  });
}
