import { useParams } from "@tanstack/react-router";
import { AppFrame } from "./app-shell";
import { SessionDetailPage } from "./session-detail";
import { SessionListPanel } from "./session-list";

function TraceEmptyState() {
  return (
    <article className="flex min-h-full items-center justify-center px-6 py-6">
      <div className="w-full max-w-xl rounded-md border border-border bg-surface p-6 shadow-sm">
        <div className="text-sm font-semibold uppercase text-muted">Trace</div>
        <h2 className="mt-3 text-2xl font-semibold tracking-normal text-foreground">
          Select a Pi session
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Choose a session from the left list to replay its timeline, cost, tokens, thinking, and
          tool I/O.
        </p>
      </div>
    </article>
  );
}

export function TraceIndexPage() {
  return (
    <AppFrame sidebar={<SessionListPanel />}>
      <TraceEmptyState />
    </AppFrame>
  );
}

export function TraceSessionPage() {
  const { sessionId } = useParams({ from: "/sessions/$sessionId" });

  return (
    <AppFrame sidebar={<SessionListPanel selectedSessionId={sessionId} />}>
      <SessionDetailPage />
    </AppFrame>
  );
}
