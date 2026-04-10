import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { participant_id, paid, premium } = await req.json();
  const supabase = createServiceClient();
  const updates: Record<string, boolean> = {};
  if (paid !== undefined) updates.paid = paid;
  if (premium !== undefined) updates.premium = premium;
  const { data, error } = await supabase.from("participants").update(updates).eq("id", participant_id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { participant_id } = await req.json();
  const supabase = createServiceClient();
  // Picks are cascade-deleted via FK constraint
  const { error } = await supabase.from("participants").delete().eq("id", participant_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
