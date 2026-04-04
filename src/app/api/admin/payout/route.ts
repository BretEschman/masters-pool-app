import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { year, payout_config } = await req.json();
  if (!year || !payout_config)
    return NextResponse.json({ error: "year and payout_config required" }, { status: 400 });

  // Validate payout_config: keys should be place numbers, values percentages
  const total = Object.values(payout_config as Record<string, number>).reduce(
    (sum: number, v: number) => sum + v,
    0
  );
  if (total !== 100)
    return NextResponse.json({ error: "Percentages must add up to 100" }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("years")
    .update({ payout_config })
    .eq("year", year)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
