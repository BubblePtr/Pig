import type { SessionSummary } from "./sessions";

export type DailyProjectCost = {
  project: string;
  costUsd: number;
};

export type DailyCostByProject = {
  date: string;
  totalCostUsd: number;
  projects: DailyProjectCost[];
};

export type DailyTokenUsage = {
  date: string;
  totalTokens: number;
};

function toUtcDay(timestamp: string) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dayRange(sessions: SessionSummary[]) {
  if (sessions.length === 0) {
    return [];
  }

  const days = sessions.map((session) => toUtcDay(session.timestamp)).sort();
  const start = new Date(`${days[0]}T00:00:00.000Z`);
  const end = new Date(`${days[days.length - 1]}T00:00:00.000Z`);
  const range: string[] = [];

  for (let cursor = start; cursor <= end; cursor = addUtcDays(cursor, 1)) {
    range.push(cursor.toISOString().slice(0, 10));
  }

  return range;
}

export function aggregateDailyCostByProject(sessions: SessionSummary[]): DailyCostByProject[] {
  const totals = new Map<string, Map<string, number>>();

  for (const session of sessions) {
    const day = toUtcDay(session.timestamp);
    const projectTotals = totals.get(day) ?? new Map<string, number>();
    projectTotals.set(
      session.project,
      (projectTotals.get(session.project) ?? 0) + session.totalCostUsd,
    );
    totals.set(day, projectTotals);
  }

  return dayRange(sessions).map((date) => {
    const projects = Array.from(totals.get(date)?.entries() ?? [])
      .map(([project, costUsd]) => ({ project, costUsd }))
      .sort((left, right) => right.costUsd - left.costUsd || left.project.localeCompare(right.project));

    return {
      date,
      totalCostUsd: projects.reduce((sum, project) => sum + project.costUsd, 0),
      projects,
    };
  });
}

export function aggregateDailyTokens(sessions: SessionSummary[]): DailyTokenUsage[] {
  const totals = new Map<string, number>();

  for (const session of sessions) {
    const day = toUtcDay(session.timestamp);
    totals.set(day, (totals.get(day) ?? 0) + session.totalTokens);
  }

  return dayRange(sessions).map((date) => ({
    date,
    totalTokens: totals.get(date) ?? 0,
  }));
}
