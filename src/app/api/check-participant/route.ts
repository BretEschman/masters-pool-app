import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const supabase = createServiceClient();

  // Check across all years for this participant (most recent first)
  const { data } = await supabase
    .from("participants")
    .select("id, name, paid, year_id, years!inner(year)")
    .ilike("name", name.trim())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ paid: data.paid, name: data.name });
}
