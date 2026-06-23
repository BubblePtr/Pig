import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useRefreshOnWindowFocus } from "./refresh";
import {
  formatCost,
  formatTimestamp,
  formatTokens,
  listSessions,
  relativeTime,
  type SessionSummary,
  type Title,
} from "./sessions";

// Distinct project names for the filter control, sorted for a stable menu.
export function distinctProjects<T extends { project: string }>(sessions: T[]): string[] {
  return Array.from(new Set(sessions.map((session) => session.project))).sort((a, b) =>
    a.localeCompare(b),
  );
}

// A null project means "all projects" — the list is shown unfiltered.
export function filterByProject<T extends { project: string }>(
  sessions: T[],
  project: string | null,
): T[] {
  if (!project) {
    return sessions;
  }
  return sessions.filter((session) => session.project === project);
}

function SessionTitle({ title }: { title: Title }) {
  if (title.kind === "command") {
    return (
      <div className="flex min-w-0 flex-col gap-1">
        <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-surface-muted px-2 py-1 text-sm font-medium text-foreground">
          <span aria-hidden="true" className="shrink-0">
            ⚡
          </span>
          <span className="block truncate">{title.name}</span>
        </span>
        {title.args ? <span className="block truncate text-xs text-muted">{title.args}</span> : null}
      </div>
    );
  }

  if (title.kind === "skill") {
    return (
      <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-surface-muted px-2 py-1 text-sm font-medium text-foreground">
        <span aria-hidden="true" className="shrink-0">
          🧩
        </span>
        <span className="block truncate">{title.name}</span>
      </span>
    );
  }

  if (title.kind === "text") {
    return <span className="block truncate text-sm text-foreground">{title.sentence}</span>;
  }

  return (
    <span className="block truncate text-sm text-muted">
      {title.text.length > 0 ? title.text : "Untitled session"}
    </span>
  );
}

function SessionRow({
  session,
  selected,
}: {
  session: SessionSummary;
  selected: boolean;
}) {
  return (
    <li>
      <Link
        to="/sessions/$sessionId"
        params={{ sessionId: session.id }}
        className={`block border-b border-border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-foreground/20 ${
          selected ? "bg-surface-muted" : "hover:bg-surface-hover"
        }`}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <SessionTitle title={session.title} />
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <span className="truncate">{session.project}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={session.timestamp} title={formatTimestamp(session.timestamp)}>
                {relativeTime(session.timestamp)}
              </time>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-sm font-semibold text-foreground">
              {formatCost(session.totalCostUsd)}
            </div>
            <div className="mt-1 text-xs text-muted">{formatTokens(session.totalTokens)}</div>
          </div>
        </div>
      </Link>
    </li>
  );
}

export function SessionListPanel({ selectedSessionId }: { selectedSessionId?: string }) {
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: listSessions,
  });
  const { refetch } = sessions;
  const allSessions = sessions.data ?? [];
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const projects = useMemo(() => distinctProjects(allSessions), [allSessions]);
  const sessionRows = useMemo(
    () => filterByProject(allSessions, selectedProject),
    [allSessions, selectedProject],
  );

  useRefreshOnWindowFocus(refetch);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-4 py-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase text-muted">Trace</h2>
            <p className="mt-1 text-xs text-muted">Recent Pi sessions</p>
          </div>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-surface text-foreground shadow-sm transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => sessions.refetch()}
            disabled={sessions.isFetching}
            title="Refresh sessions"
            aria-label="Refresh sessions"
          >
            <RefreshCw className={`size-4 ${sessions.isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        <label className="sr-only" htmlFor="project-filter">
          Filter by project
        </label>
        <select
          id="project-filter"
          className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm text-foreground shadow-sm transition hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-foreground/20"
          value={selectedProject ?? "all"}
          onChange={(event) =>
            setSelectedProject(event.target.value === "all" ? null : event.target.value)
          }
        >
          <option value="all">All projects</option>
          {projects.map((project) => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {sessions.isLoading ? (
          <div className="px-4 py-10 text-sm text-muted">Loading sessions...</div>
        ) : sessions.isError ? (
          <div className="px-4 py-10 text-sm text-danger">
            Could not read the Pi agent directory.
          </div>
        ) : sessionRows.length === 0 ? (
          <div className="px-4 py-10 text-sm text-muted">No sessions found.</div>
        ) : (
          <ol>
            {sessionRows.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                selected={session.id === selectedSessionId}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
