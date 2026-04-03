import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const ESPN_LEADERBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";

interface ESPNCompetitor {
  athlete: { displayName: string };
  status: { type: { name: string } };
  linescores?: { value: number }[];
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: yearData } = await supabase.from("years").select("*").order("year", { ascending: false }).limit(1).single();
  if (!yearData) return NextResponse.json({ message: "No year configured" });

  let espnData;
  try {
    const res = await fetch(ESPN_LEADERBOARD_URL, { cache: "no-store" });
    espnData = await res.json();
  } catch {
    return NextResponse.json({ error: "Failed to fetch ESPN data" }, { status: 502 });
  }

  const event = espnData.events?.find((e: { name: string }) =>
    e.name?.toLowerCase().includes("masters") || e.name?.toLowerCase().includes("augusta")
  );
  if (!event) return NextResponse.json({ message: "Masters not currently active on ESPN" });

  const competition = event.competitions?.[0];
  if (!competition) return NextResponse.json({ message: "No competition data" });
  const competitors: ESPNCompetitor[] = competition.competitors || [];

  const { data: dbGolfers } = await supabase.from("golfers").select("*").eq("year_id", yearData.id);
  if (!dbGolfers) return NextResponse.json({ message: "No golfers in DB" });

  let updated = 0;
  const par = 72;

  for (const dbGolfer of dbGolfers) {
    const espnGolfer = competitors.find((c) => {
      const espnName = c.athlete?.displayName?.toLowerCase();
      const dbName = dbGolfer.name.toLowerCase();
      return espnName === dbName || espnName?.includes(dbName) || dbName.includes(espnName || "");
    });
    if (!espnGolfer) continue;

    const linescores = espnGolfer.linescores || [];
    const updates: Record<string, number | string | null> = {};

    for (let day = 0; day < 4; day++) {
      if (linescores[day]?.value !== undefined) {
        updates[`day${day + 1}_score`] = linescores[day].value - par;
      }
    }

    const statusName = espnGolfer.status?.type?.name?.toLowerCase() || "";
    if (statusName.includes("cut")) updates.status = "cut";
    else if (statusName.includes("wd") || statusName.includes("withdraw")) updates.status = "wd";

    if (Object.keys(updates).length > 0) {
      await supabase.from("golfers").update(updates).eq("id", dbGolfer.id);
      updated++;
    }
  }

  return NextResponse.json({ message: `Updated ${updated} golfers`, total: dbGolfers.length });
}
