import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { year_id, golfers } = await req.json();
  const supabase = createServiceClient();
  await supabase.from("golfers").delete().eq("year_id", year_id);
  const rows = golfers.map((g: { name: string; tier: number }) => ({ year_id, name: g.name, tier: g.tier }));
  const { data, error } = await supabase.from("golfers").insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
