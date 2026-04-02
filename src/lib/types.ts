export type GolferStatus = "active" | "cut" | "wd";

export interface Year {
  id: string;
  year: number;
  access_code: string;
  entry_fee: number;
  picks_open: boolean;
  winning_score: number | null;
}

export interface Golfer {
  id: string;
  year_id: string;
  name: string;
  tier: number;
  day1_score: number | null;
  day2_score: number | null;
  day3_score: number | null;
  day4_score: number | null;
  status: GolferStatus;
}

export interface Participant {
  id: string;
  year_id: string;
  name: string;
  paid: boolean;
  tiebreaker_guess: number;
}

export interface Pick {
  id: string;
  participant_id: string;
  golfer_id: string;
}

export interface ParticipantStanding {
  participant: Participant;
  golfers: Golfer[];
  day1_score: number;
  day2_score: number;
  day3_score: number;
  day4_score: number;
  total: number;
  rank: number;
  tiebreaker_diff: number | null;
}
