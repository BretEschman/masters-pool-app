import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";

const PAR = 72;

interface ESPNAthlete {
  displayName: string;
}

interface ESPNStatusType {
  name: string;
  description?: string;
}

interface ESPNStatus {
  type: ESPNStatusType;
  period?: number;
  displayValue?: string;
}

interface ESPNLinescore {
  value: number;
  displayValue?: string;
}

interface ESPNCompetitor {
  athlete: ESPNAthlete;
  status: ESPNStatus;
  linescores?: ESPNLinescore[];
  score?: { displayValue?: string };
  sortOrder?: number;
}

interface ESPNCompetition {
  competitors?: ESPNCompetitor[];
  status?: {
    type?: { name?: string; description?: string };
    period?: number;
  };
}

interface ESPNEvent {
  name?: string;
  competitions?: ESPNCompetition[];
  status?: {
    type?: { name?: string };
    period?: number;
  };
}

interface LiveGolfer {
  name: string;
  scoreToday: number | null;
  scoreTodayDisplay: string;
  thru: string;
  totalScore: string;
  position: number;
  state: "on_course" | "finished" | "not_started";
  pickCount: number;
}

export async function GET() {
  // Fetch ESPN data
  let espnData;
  try {
    const res = await fetch(ESPN_SCOREBOARD_URL, { cache: "no-store" });
    espnData = await res.json();
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch ESPN data" },
      { status: 502 }
    );
  }

  // Find the Masters event
  const event: ESPNEvent | undefined = espnData.events?.find(
    (e: ESPNEvent) =>
      e.name?.toLowerCase().includes("masters") ||
      e.name?.toLowerCase().includes("augusta")
  );

  if (!event) {
    return NextResponse.json({ active: false, golfers: [], round: null });
  }

  const competition = event.competitions?.[0];
  if (!competition) {
    return NextResponse.json({ active: false, golfers: [], round: null });
  }

  const competitors: ESPNCompetitor[] = competition.competitors || [];

  // Determine the current round from the event or competition status
  const currentRound =
    event.status?.period ||
    competition.status?.period ||
    1;

  // Get our pool golfers + pick counts from the DB
  const supabase = createServiceClient();
  const { data: yearData } = await supabase
    .from("years")
    .select("*")
    .order("year", { ascending: false })
    .limit(1)
    .single();

  let pickCountMap: Record<string, number> = {};

  if (yearData) {
    const { data: golfers } = await supabase
      .from("golfers")
      .select("id, name")
      .eq("year_id", yearData.id);

    const { data: participants } = await supabase
      .from("participants")
      .select("id")
      .eq("year_id", yearData.id);

    if (golfers && participants && participants.length > 0) {
      const participantIds = participants.map((p) => p.id);
      const { data: picks } = await supabase
        .from("picks")
        .select("golfer_id")
        .in("participant_id", participantIds);

      if (picks) {
        const golferIdCounts: Record<string, number> = {};
        for (const pick of picks) {
          golferIdCounts[pick.golfer_id] =
            (golferIdCounts[pick.golfer_id] || 0) + 1;
        }
        // Map golfer names to pick counts
        for (const g of golfers) {
          if (golferIdCounts[g.id]) {
            pickCountMap[g.name.toLowerCase()] = golferIdCounts[g.id];
          }
        }
      }
    }
  }

  // Get the set of golfer names in our pool
  const poolGolferNames = new Set(Object.keys(pickCountMap));

  // Also add all DB golfer names even if pick count is 0
  if (yearData) {
    const { data: allGolfers } = await supabase
      .from("golfers")
      .select("name")
      .eq("year_id", yearData.id);
    if (allGolfers) {
      for (const g of allGolfers) {
        poolGolferNames.add(g.name.toLowerCase());
      }
    }
  }

  // Process competitors
  const liveGolfers: LiveGolfer[] = [];

  for (const comp of competitors) {
    const name = comp.athlete?.displayName;
    if (!name) continue;

    // Check if this golfer is in our pool
    const nameLower = name.toLowerCase();
    const inPool = [...poolGolferNames].some(
      (pn) =>
        pn === nameLower ||
        nameLower.includes(pn) ||
        pn.includes(nameLower)
    );
    if (!inPool) continue;

    const statusName = comp.status?.type?.name?.toLowerCase() || "";
    const linescores = comp.linescores || [];
    const roundIndex = currentRound - 1;

    // Determine state
    let state: "on_course" | "finished" | "not_started";
    if (
      statusName.includes("in") ||
      statusName === "active" ||
      statusName === "in progress"
    ) {
      state = "on_course";
    } else if (
      statusName.includes("complete") ||
      statusName.includes("finish") ||
      statusName.includes("cut") ||
      statusName.includes("wd") ||
      statusName.includes("withdraw")
    ) {
      state = "finished";
    } else if (
      statusName.includes("pre") ||
      statusName.includes("scheduled") ||
      statusName === ""
    ) {
      state = "not_started";
    } else {
      // Check if linescores exist for the current round
      if (linescores[roundIndex]?.value > 0 && linescores[roundIndex]?.displayValue !== "-") {
        state = "finished";
      } else {
        state = "not_started";
      }
    }

    // Calculate today's score (relative to par)
    let scoreToday: number | null = null;
    let scoreTodayDisplay = "-";
    if (linescores[roundIndex]?.value > 0 && linescores[roundIndex]?.displayValue !== "-") {
      scoreToday = linescores[roundIndex].value - PAR;
      scoreTodayDisplay =
        scoreToday === 0 ? "E" : scoreToday > 0 ? `+${scoreToday}` : `${scoreToday}`;
    }

    // Thru holes
    let thru = "-";
    if (state === "finished" && linescores[roundIndex]?.value > 0) {
      thru = "F";
    } else if (state === "on_course") {
      // ESPN status.displayValue often has the thru info like "Thru 12" or "F"
      const statusDisplay = comp.status?.displayValue || "";
      if (statusDisplay) {
        thru = statusDisplay;
      }
    }

    // Total tournament score (use ESPN display value)
    const totalScore = comp.score?.displayValue || "-";

    // Pick count
    const pickCount =
      pickCountMap[nameLower] ||
      [...Object.entries(pickCountMap)].find(
        ([pn]) => nameLower.includes(pn) || pn.includes(nameLower)
      )?.[1] ||
      0;

    liveGolfers.push({
      name,
      scoreToday,
      scoreTodayDisplay,
      thru,
      totalScore,
      position: comp.sortOrder || 999,
      state,
      pickCount,
    });
  }

  // Sort: on_course by today's score, then finished by today's score, then not started
  liveGolfers.sort((a, b) => {
    const stateOrder = { on_course: 0, finished: 1, not_started: 2 };
    if (stateOrder[a.state] !== stateOrder[b.state])
      return stateOrder[a.state] - stateOrder[b.state];
    return (a.scoreToday ?? 99) - (b.scoreToday ?? 99);
  });

  return NextResponse.json({
    active: true,
    round: currentRound,
    golfers: liveGolfers,
  });
}
