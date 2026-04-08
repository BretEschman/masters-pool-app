import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// Update golfer positions (odds order within tier) WITHOUT deleting golfers,
// so submitted picks are preserved. Accepts the same textual format as the
// upload endpoint: "Tier 1\nName1\nName2\nTier 2\nName3..."
export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { year_id, ordered } = await req.json();
  if (!year_id || !Array.isArray(ordered)) {
    return NextResponse.json({ error: "year_id and ordered[] required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fetch all golfers for this year so we can match by name
  const { data: existing, error: fetchErr } = await supabase
    .from("golfers")
    .select("id, name, tier")
    .eq("year_id", year_id);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "No golfers found" }, { status: 404 });

  // Build lookup: normalized name -> golfer
  const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
  const byName = new Map<string, { id: string; tier: number }>();
  for (const g of existing) byName.set(normalize(g.name), { id: g.id, tier: g.tier });

  const positionByTier: Record<number, number> = {};
  const updates: { id: string; position: number }[] = [];
  const notFound: string[] = [];
  const tierMismatches: string[] = [];

  for (const item of ordered as { name: string; tier: number }[]) {
    const found = byName.get(normalize(item.name));
    if (!found) {
      notFound.push(item.name);
      continue;
    }
    if (found.tier !== item.tier) {
      tierMismatches.push(`${item.name} (in DB tier ${found.tier}, provided tier ${item.tier})`);
      continue;
    }
    positionByTier[item.tier] = (positionByTier[item.tier] || 0) + 1;
    updates.push({ id: found.id, position: positionByTier[item.tier] });
  }

  // Apply updates
  for (const u of updates) {
    const { error } = await supabase.from("golfers").update({ position: u.position }).eq("id", u.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    updated: updates.length,
    not_found: notFound,
    tier_mismatches: tierMismatches,
  });
}
