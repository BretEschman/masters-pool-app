import { describe, it, expect } from "vitest";
import { getEffectiveScore, calculateDayScore, calculateStandings } from "./scoring";
import { Golfer, Participant } from "./types";

function makeGolfer(overrides: Partial<Golfer> = {}): Golfer {
  return {
    id: "g1", year_id: "y1", name: "Test Golfer", tier: 1,
    day1_score: null, day2_score: null, day3_score: null, day4_score: null,
    status: "active", ...overrides,
  };
}

describe("getEffectiveScore", () => {
  it("returns actual score for active golfer", () => {
    expect(getEffectiveScore(makeGolfer({ day1_score: -3 }), 1)).toBe(-3);
  });
  it("returns null if no score yet", () => {
    expect(getEffectiveScore(makeGolfer(), 1)).toBeNull();
  });
  it("returns 10 for cut golfer on day 3 and 4", () => {
    const g = makeGolfer({ day1_score: 2, day2_score: 3, status: "cut" });
    expect(getEffectiveScore(g, 1)).toBe(2);
    expect(getEffectiveScore(g, 2)).toBe(3);
    expect(getEffectiveScore(g, 3)).toBe(10);
    expect(getEffectiveScore(g, 4)).toBe(10);
  });
  it("returns 10 for withdrawn golfer on remaining days", () => {
    const g = makeGolfer({ day1_score: -1, status: "wd" });
    expect(getEffectiveScore(g, 1)).toBe(-1);
    expect(getEffectiveScore(g, 2)).toBe(10);
    expect(getEffectiveScore(g, 3)).toBe(10);
    expect(getEffectiveScore(g, 4)).toBe(10);
  });
});

describe("calculateDayScore", () => {
  it("returns sum of best 4 out of 8", () => {
    const golfers = [-5, -3, -2, -1, 0, 1, 3, 5].map((s, i) =>
      makeGolfer({ id: String(i), day1_score: s })
    );
    expect(calculateDayScore(golfers, 1)).toBe(-11);
  });
  it("returns 0 if no scores yet", () => {
    const golfers = Array(8).fill(null).map((_, i) => makeGolfer({ id: String(i) }));
    expect(calculateDayScore(golfers, 1)).toBe(0);
  });
});

describe("calculateStandings", () => {
  it("ranks by total ascending", () => {
    const participants: Participant[] = [
      { id: "p1", year_id: "y1", name: "Alice", paid: true, tiebreaker_guess: -10 },
      { id: "p2", year_id: "y1", name: "Bob", paid: true, tiebreaker_guess: -8 },
    ];
    const golfersByParticipant: Record<string, Golfer[]> = {
      p1: Array(8).fill(null).map((_, i) =>
        makeGolfer({ id: `p1g${i}`, day1_score: i < 4 ? -2 : 5, day2_score: i < 4 ? -1 : 3 })
      ),
      p2: Array(8).fill(null).map((_, i) =>
        makeGolfer({ id: `p2g${i}`, day1_score: i < 4 ? -3 : 2, day2_score: i < 4 ? -2 : 1 })
      ),
    };
    const standings = calculateStandings(participants, golfersByParticipant, null);
    expect(standings[0].participant.name).toBe("Bob");
    expect(standings[0].total).toBe(-20);
    expect(standings[1].participant.name).toBe("Alice");
    expect(standings[1].total).toBe(-12);
  });
});
