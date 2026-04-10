import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { normalizeName } from "@/lib/name-match";

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";

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
        // Map golfer names to pick counts (normalized for accent matching)
        for (const g of golfers) {
          if (golferIdCounts[g.id]) {
            pickCountMap[normalizeName(g.name)] = golferIdCounts[g.id];
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
        poolGolferNames.add(normalizeName(g.name));
      }
    }
  }

  // Process competitors
  const liveGolfers: LiveGolfer[] = [];

  for (const comp of competitors) {
    const name = comp.athlete?.displayName;
    if (!name) continue;

    // Check if this golfer is in our pool (accent-normalized)
    const nameNorm = normalizeName(name);
    const inPool = [...poolGolferNames].some(
      (pn) =>
        pn === nameNorm ||
        nameNorm.includes(pn) ||
        pn.includes(nameNorm)
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
      if (linescores[roundIndex]?.displayValue && linescores[roundIndex]?.displayValue !== "-") {
        state = "finished";
      } else {
        state = "not_started";
      }
    }

    // Calculate today's score from displayValue (relative to par)
    // "E" → 0, "+3" → 3, "-5" → -5, "-" → null
    let scoreToday: number | null = null;
    let scoreTodayDisplay = "-";
    const roundDV = linescores[roundIndex]?.displayValue;
    if (roundDV && roundDV !== "-") {
      if (roundDV === "E") {
        scoreToday = 0;
      } else {
        const parsed = parseInt(roundDV, 10);
        if (!isNaN(parsed)) scoreToday = parsed;
      }
      scoreTodayDisplay = roundDV;
    }

    // Thru holes
    let thru = "-";
    if (state === "finished" && linescores[roundIndex]?.displayValue && linescores[roundIndex]?.displayValue !== "-") {
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
      pickCountMap[nameNorm] ||
      [...Object.entries(pickCountMap)].find(
        ([pn]) => nameNorm.includes(pn) || pn.includes(nameNorm)
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

  // Calculate projected cut line (top 50 + ties after R2)
  // Use all competitors, not just pool golfers
  let projectedCut: number | null = null;
  if (currentRound <= 2) {
    const allTotals: number[] = [];
    for (const comp of competitors) {
      const ls = comp.linescores || [];
      let total = 0;
      let hasScore = false;
      for (let d = 0; d < 2; d++) {
        const dv = ls[d]?.displayValue;
        if (dv && dv !== "-") {
          if (dv === "E") { hasScore = true; }
          else {
            const parsed = parseInt(dv, 10);
            if (!isNaN(parsed)) { total += parsed; hasScore = true; }
          }
        }
      }
      if (hasScore) allTotals.push(total);
    }
    allTotals.sort((a, b) => a - b);
    if (allTotals.length >= 50) {
      projectedCut = allTotals[49]; // 50th position (0-indexed)
    }
  }

  return NextResponse.json({
    active: true,
    round: currentRound,
    golfers: liveGolfers,
    projectedCut,
  });
}
