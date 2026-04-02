import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const supabase = createServiceClient();
  const { data } = await supabase.from("years").select("access_code").order("year", { ascending: false });
  const valid = data?.some((y) => y.access_code === code);
  if (!valid) return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  return NextResponse.json({ ok: true });
}
