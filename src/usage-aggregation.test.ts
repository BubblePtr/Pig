import { describe, expect, it } from "vitest";
import { aggregateDailyCostByProject, aggregateDailyTokens } from "./usage-aggregation";
import type { SessionSummary } from "./sessions";

function session(
  id: string,
  timestamp: string,
  project: string,
  totalCostUsd: number,
  totalTokens: number,
): SessionSummary {
  return {
    id,
    timestamp,
    project,
    totalCostUsd,
    totalTokens,
    title: { kind: "raw", text: id },
  };
}

describe("aggregateDailyCostByProject", () => {
  it("returns an empty range for no sessions", () => {
    expect(aggregateDailyCostByProject([])).toEqual([]);
  });

  it("groups cost by UTC day and project, filling sparse days", () => {
    const sessions = [
      session("a", "2026-01-01T23:00:00.000Z", "alpha", 0.25, 100),
      session("b", "2026-01-03T01:00:00.000Z", "beta", 0.5, 200),
      session("c", "2026-01-03T12:00:00.000Z", "alpha", 0.75, 300),
    ];

    expect(aggregateDailyCostByProject(sessions)).toEqual([
      {
        date: "2026-01-01",
        totalCostUsd: 0.25,
        projects: [{ project: "alpha", costUsd: 0.25 }],
      },
      {
        date: "2026-01-02",
        totalCostUsd: 0,
        projects: [],
      },
      {
        date: "2026-01-03",
        totalCostUsd: 1.25,
        projects: [
          { project: "alpha", costUsd: 0.75 },
          { project: "beta", costUsd: 0.5 },
        ],
      },
    ]);
  });
});

describe("aggregateDailyTokens", () => {
  it("returns an empty range for no sessions", () => {
    expect(aggregateDailyTokens([])).toEqual([]);
  });

  it("groups tokens by UTC day, filling sparse days", () => {
    const sessions = [
      session("a", "2026-01-01T23:00:00.000Z", "alpha", 0.25, 100),
      session("b", "2026-01-03T01:00:00.000Z", "beta", 0.5, 200),
      session("c", "2026-01-03T12:00:00.000Z", "alpha", 0.75, 300),
    ];

    expect(aggregateDailyTokens(sessions)).toEqual([
      { date: "2026-01-01", totalTokens: 100 },
      { date: "2026-01-02", totalTokens: 0 },
      { date: "2026-01-03", totalTokens: 500 },
    ]);
  });
});
