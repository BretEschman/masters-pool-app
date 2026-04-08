import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { year_id, golfers } = await req.json();
  const supabase = createServiceClient();
  await supabase.from("golfers").delete().eq("year_id", year_id);
  // Assign position within each tier based on upload order (best odds = position 1)
  const positionByTier: Record<number, number> = {};
  const rows = golfers.map((g: { name: string; tier: number }) => {
    positionByTier[g.tier] = (positionByTier[g.tier] || 0) + 1;
    return { year_id, name: g.name, tier: g.tier, position: positionByTier[g.tier] };
  });
  const { data, error } = await supabase.from("golfers").insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
