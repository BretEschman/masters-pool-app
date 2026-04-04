import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXCEL_DIR = path.join(__dirname, "..", "..");

interface ExcelGolfer {
  name: string;
  tier: number;
  day1: number | null;
  day2: number | null;
  day3: number | null;
  day4: number | null;
  status: "active" | "cut" | "wd";
}

interface ExcelParticipant {
  name: string;
  golferNames: string[];
}

// Remap tiers for years that used more than 4 tiers
// 2024 used tiers 1-6 in the spreadsheet; we collapse to 1-4
function remapTier(tier: number, tierMap?: Record<number, number>): number {
  if (tierMap && tierMap[tier] !== undefined) return tierMap[tier];
  return Math.min(tier, 4);
}

async function importYear(filename: string, year: number, accessCode: string, tierMap?: Record<number, number>) {
  console.log(`\nImporting ${year} from ${filename}...`);
  const filePath = path.join(EXCEL_DIR, filename);
  const workbook = XLSX.readFile(filePath);

  const leaderboardSheet = workbook.Sheets["Leaderboard"];
  const lbData = XLSX.utils.sheet_to_json(leaderboardSheet, { header: 1 }) as unknown[][];

  const golfers: ExcelGolfer[] = [];
  for (let i = 3; i < lbData.length; i++) {
    const row = lbData[i];
    if (!row) continue;
    const name = row[2] as string | undefined;
    const tier = row[3] as number | undefined;
    const d1 = row[4] as number | null | undefined;
    const d2 = row[5] as number | null | undefined;
    const d3 = row[6] as number | null | undefined;
    const d4 = row[7] as number | null | undefined;
    if (!name || typeof name !== "string" || !tier) continue;

    let status: "active" | "cut" | "wd" = "active";
    const hasD1 = d1 !== null && d1 !== undefined && !isNaN(Number(d1));
    const hasD2 = d2 !== null && d2 !== undefined && !isNaN(Number(d2));
    const hasD3 = d3 !== null && d3 !== undefined && !isNaN(Number(d3));
    if (hasD1 && hasD2 && !hasD3) status = "cut";

    golfers.push({
      name: name.trim(), tier: remapTier(Number(tier), tierMap),
      day1: hasD1 ? Number(d1) : null, day2: hasD2 ? Number(d2) : null,
      day3: hasD3 ? Number(d3) : null, day4: d4 !== null && d4 !== undefined && !isNaN(Number(d4)) ? Number(d4) : null,
      status,
    });
  }

  const selectionsSheet = workbook.Sheets["Selections"];
  const selData = XLSX.utils.sheet_to_json(selectionsSheet, { header: 1 }) as unknown[][];
  const participants: ExcelParticipant[] = [];
  for (let i = 3; i < selData.length; i++) {
    const row = selData[i];
    if (!row) continue;
    const name = row[1] as string | undefined;
    if (!name || typeof name !== "string") continue;
    const golferNames: string[] = [];
    for (let c = 2; c <= 9; c++) {
      const gName = row[c] as string | undefined;
      if (gName && typeof gName === "string") golferNames.push(gName.trim());
    }
    if (golferNames.length > 0) participants.push({ name: name.trim(), golferNames });
  }

  console.log(`  Found ${golfers.length} golfers, ${participants.length} participants`);

  const { data: yearRecord, error: yearErr } = await supabase
    .from("years").upsert({ year, access_code: accessCode, entry_fee: 25, picks_open: false }, { onConflict: "year" }).select().single();
  if (yearErr) { console.error("  Year insert error:", yearErr); return; }

  await supabase.from("participants").delete().eq("year_id", yearRecord.id);
  await supabase.from("golfers").delete().eq("year_id", yearRecord.id);

  const golferRows = golfers.map((g) => ({
    year_id: yearRecord.id, name: g.name, tier: g.tier,
    day1_score: g.day1, day2_score: g.day2, day3_score: g.day3, day4_score: g.day4, status: g.status,
  }));
  const { data: insertedGolfers, error: gErr } = await supabase.from("golfers").insert(golferRows).select();
  if (gErr) { console.error("  Golfer insert error:", gErr); return; }
  console.log(`  Inserted ${insertedGolfers?.length} golfers`);

  const golferNameMap = new Map((insertedGolfers || []).map((g) => [g.name.toLowerCase(), g.id]));
  await supabase.from("participants").delete().eq("year_id", yearRecord.id);

  for (const p of participants) {
    const { data: pRecord, error: pErr } = await supabase
      .from("participants").insert({ year_id: yearRecord.id, name: p.name, paid: true, tiebreaker_guess: 0 }).select().single();
    if (pErr) { console.error(`  Participant error for ${p.name}:`, pErr); continue; }

    const pickRows = p.golferNames
      .map((gName) => { const gid = golferNameMap.get(gName.toLowerCase()); return gid ? { participant_id: pRecord.id, golfer_id: gid } : null; })
      .filter(Boolean);
    if (pickRows.length > 0) {
      const { error: pickErr } = await supabase.from("picks").insert(pickRows);
      if (pickErr) console.error(`  Pick error for ${p.name}:`, pickErr);
    }
  }
  console.log(`  Done importing ${year}!`);
}

async function main() {
  await importYear("2023_Master's Pool.xlsx", 2023, "masters2023");
  await importYear("2024_Master's_Pool_scoring_sheet.xlsx", 2024, "masters2024", { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4 });
  await importYear("2025_Master's_Pool_scoring_sheet.xlsx", 2025, "masters2025");
  console.log("\nImport complete!");
}

main().catch(console.error);
