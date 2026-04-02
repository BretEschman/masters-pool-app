import { supabase, createServiceClient } from "./supabase";
import { Year, Golfer, Participant, Pick } from "./types";

export async function getYears(): Promise<Year[]> {
  const { data, error } = await supabase
    .from("years")
    .select("*")
    .order("year", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getYear(year: number): Promise<Year | null> {
  const { data, error } = await supabase
    .from("years")
    .select("*")
    .eq("year", year)
    .single();
  if (error) return null;
  return data;
}

export async function getGolfers(yearId: string): Promise<Golfer[]> {
  const { data, error } = await supabase
    .from("golfers")
    .select("*")
    .eq("year_id", yearId)
    .order("tier")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getParticipants(yearId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("year_id", yearId)
    .order("name");
  if (error) throw error;
  return data;
}

export async function getPicksForParticipant(participantId: string): Promise<Pick[]> {
  const { data, error } = await supabase
    .from("picks")
    .select("*")
    .eq("participant_id", participantId);
  if (error) throw error;
  return data;
}

export async function getAllPicksForYear(yearId: string): Promise<{ participant_id: string; golfer_id: string }[]> {
  const { data: participants } = await supabase
    .from("participants")
    .select("id")
    .eq("year_id", yearId);
  if (!participants || participants.length === 0) return [];
  const participantIds = participants.map((p) => p.id);
  const { data, error } = await supabase
    .from("picks")
    .select("participant_id, golfer_id")
    .in("participant_id", participantIds);
  if (error) throw error;
  return data || [];
}
