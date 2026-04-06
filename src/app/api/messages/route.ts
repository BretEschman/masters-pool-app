import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const yearId = req.nextUrl.searchParams.get("year_id");
  if (!yearId)
    return NextResponse.json({ error: "year_id required" }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("year_id", yearId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { year_id, author, body } = await req.json();

  if (!year_id || !author?.trim() || !body?.trim())
    return NextResponse.json({ error: "year_id, author, and body are required" }, { status: 400 });

  if (body.length > 500)
    return NextResponse.json({ error: "Message body must be 500 characters or less" }, { status: 400 });

  const supabase = createServiceClient();

  // Validate that the author is a real participant (prevents impersonation)
  const { data: participant } = await supabase
    .from("participants")
    .select("id")
    .ilike("name", author.trim())
    .limit(1)
    .single();

  if (!participant)
    return NextResponse.json({ error: "Author must be a registered participant" }, { status: 403 });

  const { data, error } = await supabase
    .from("messages")
    .insert({ year_id, author: author.trim(), body: body.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message_id } = await req.json();
  if (!message_id)
    return NextResponse.json({ error: "message_id required" }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase.from("messages").delete().eq("id", message_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
