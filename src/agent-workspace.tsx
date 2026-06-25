import { Button, Card, ScrollShadow, Tooltip } from "@heroui/react";
import { ChainOfThought, ChatConversation, ChatMessage, PromptInput, Sheet } from "@heroui-pro/react";
import { Activity, GitBranch } from "lucide-react";
import { useState } from "react";
import { AppFrame } from "./app-shell";
import { formatCost, formatTokens } from "./sessions";

type LiveMessage = {
  id: string;
  role: "user" | "assistant";
  body: string;
};

type RunTimelineItem = {
  id: string;
  title: string;
  meta: string;
};

type AgentWorkspaceFixture = {
  id: string;
  name: string;
  projectRoot: string;
  repoRoot: string;
  selectedSessionId: string;
  liveMessages: LiveMessage[];
  runTimeline: RunTimelineItem[];
  checkout: {
    mode: string;
    root: string;
    runtimeCwd: string;
  };
  summary: {
    model: string;
    totalCostUsd: number;
    totalTokens: number;
  };
};

const fixtureWorkspace: AgentWorkspaceFixture = {
  id: "pig",
  name: "Pig",
  projectRoot: "/Users/void/code/opensource/Pig",
  repoRoot: "/Users/void/code/opensource/Pig",
  selectedSessionId: "session-control-plane-shell",
  liveMessages: [
    {
      id: "message-user",
      role: "user",
      body: "Create the Agent Workspace entry shape for this Project.",
    },
    {
      id: "message-assistant",
      role: "assistant",
      body: "Project Sessions keep live Pi work separate from Analyze evidence.",
    },
  ],
  runTimeline: [
    {
      id: "timeline-read-context",
      title: "Project context loaded",
      meta: "Pig workspace and recent session evidence",
    },
    {
      id: "timeline-render-shell",
      title: "Workspace view prepared",
      meta: "Session list, live chat, timeline, and action surface",
    },
    {
      id: "timeline-analyze",
      title: "Analyze preserved",
      meta: "Trace and Usage stay as historical evidence views",
    },
  ],
  checkout: {
    mode: "Foreground local checkout",
    root: "/Users/void/code/opensource/Pig",
    runtimeCwd: "/Users/void/code/opensource/Pig",
  },
  summary: {
    model: "gpt-5-codex",
    totalCostUsd: 0.042137,
    totalTokens: 18_420,
  },
};

function LiveChatMessage({
  message,
  timeline = [],
}: {
  message: LiveMessage;
  timeline?: RunTimelineItem[];
}) {
  if (message.role === "user") {
    return (
      <ChatMessage.User>
        <ChatMessage.Bubble>
          <ChatMessage.Content>{message.body}</ChatMessage.Content>
        </ChatMessage.Bubble>
      </ChatMessage.User>
    );
  }

  return (
    <ChatMessage.Assistant>
      <ChatMessage.Avatar alt="Pi agent" fallback="Pi" />
      <ChatMessage.Body>
        <ChatMessage.Content>{message.body}</ChatMessage.Content>
        {timeline.length ? (
          <ChainOfThought defaultExpanded>
            <ChainOfThought.Trigger>Thought for 3s</ChainOfThought.Trigger>
            <ChainOfThought.Content>
              <ChainOfThought.Steps>
                {timeline.map((item) => (
                  <ChainOfThought.Step key={item.id} label={item.title}>
                    {item.meta}
                  </ChainOfThought.Step>
                ))}
              </ChainOfThought.Steps>
            </ChainOfThought.Content>
          </ChainOfThought>
        ) : null}
      </ChatMessage.Body>
    </ChatMessage.Assistant>
  );
}

function FullChatComposer() {
  const [draft, setDraft] = useState("");

  return (
    <div className="shrink-0 px-4 pb-4 pt-3">
      <PromptInput
        className="mx-auto w-full max-w-[44rem]"
        value={draft}
        variant="primary"
        onSubmit={() => setDraft("")}
        onValueChange={setDraft}
      >
        <PromptInput.Shell>
          <PromptInput.Content>
            <PromptInput.TextArea placeholder="What do you want to know?" />
          </PromptInput.Content>
          <PromptInput.Toolbar>
            <PromptInput.ToolbarEnd>
              <PromptInput.Send aria-label="Send" />
            </PromptInput.ToolbarEnd>
          </PromptInput.Toolbar>
        </PromptInput.Shell>
        <PromptInput.Footer>AI can make mistakes. Check important info.</PromptInput.Footer>
      </PromptInput>
    </div>
  );
}

function SessionActionsContent({ workspace }: { workspace: AgentWorkspaceFixture }) {
  return (
    <div className="grid gap-5">
      <section>
        <h3 className="text-sm font-semibold text-foreground">Diff summary</h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          No changes are attached to this Session.
        </p>
      </section>

      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <GitBranch className="size-4 text-muted" />
          Checkout
        </h3>
        <dl className="mt-3 grid gap-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase text-muted">Mode</dt>
            <dd className="mt-1 break-words text-foreground">{workspace.checkout.mode}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted">Root</dt>
            <dd className="mt-1 break-words text-foreground">{workspace.checkout.root}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted">Runtime cwd</dt>
            <dd className="mt-1 break-words text-foreground">
              {workspace.checkout.runtimeCwd}
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground">Model and cost</h3>
        <dl className="mt-3 grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Model</dt>
            <dd className="min-w-0 truncate text-right font-medium text-foreground">
              {workspace.summary.model}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Cost</dt>
            <dd className="font-medium text-foreground">
              {formatCost(workspace.summary.totalCostUsd)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Tokens</dt>
            <dd className="font-medium text-foreground">
              {formatTokens(workspace.summary.totalTokens)}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function SessionActionsSheet({ workspace }: { workspace: AgentWorkspaceFixture }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip delay={0}>
        <Tooltip.Trigger className="inline-flex">
          <Button
            isIconOnly
            aria-label="Session actions"
            size="sm"
            variant="ghost"
            onPress={() => setOpen(true)}
          >
            <Activity className="size-4" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Session actions</Tooltip.Content>
      </Tooltip>

      <Sheet isOpen={open} placement="right" onOpenChange={setOpen}>
        <Sheet.Backdrop>
          <Sheet.Content
            className="w-full md:w-[28rem]"
            style={
              open
                ? {
                    animation: "none",
                    transform: "translate3d(0, 0, 0)",
                  }
                : undefined
            }
          >
            <Sheet.Dialog>
              <Sheet.CloseTrigger />
              <Sheet.Header>
                <Sheet.Heading>Session actions</Sheet.Heading>
                <p className="mt-1 text-sm text-muted">
                  Explicit checkout, diff, model, and cost context.
                </p>
              </Sheet.Header>
              <Sheet.Body>
                <ScrollShadow className="max-h-[calc(100vh-10rem)] overflow-y-auto">
                  <SessionActionsContent workspace={workspace} />
                </ScrollShadow>
              </Sheet.Body>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    </>
  );
}

function LiveSessionColumn({ workspace }: { workspace: AgentWorkspaceFixture }) {
  return (
    <main className="h-full min-h-0 min-w-0" data-testid="live-session-column">
      <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatConversation
            aria-label="Live Chat messages"
            className="min-h-0 flex-1"
            initial="instant"
          >
            <ChatConversation.Content className="mx-auto flex w-full max-w-[44rem] flex-col gap-8 px-4 py-6">
              {workspace.liveMessages.map((message) => (
                <LiveChatMessage
                  key={message.id}
                  message={message}
                  timeline={message.role === "assistant" ? workspace.runTimeline : undefined}
                />
              ))}
              <ChatConversation.ScrollAnchor />
            </ChatConversation.Content>
          </ChatConversation>

          <FullChatComposer />
        </div>
      </Card>
    </main>
  );
}

export function AgentWorkspaceSessionsView({
  workspace = fixtureWorkspace,
}: {
  workspace?: AgentWorkspaceFixture;
}) {
  return (
    <article
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden px-6 py-6"
      data-testid="project-sessions-view"
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[96rem] flex-col gap-4">
        <div className="min-h-0 flex-1">
          <LiveSessionColumn workspace={workspace} />
        </div>
      </div>
    </article>
  );
}

export function AgentWorkspaceSessionsPage() {
  const workspace = fixtureWorkspace;

  return (
    <AppFrame toolbarActions={<SessionActionsSheet workspace={workspace} />}>
      <AgentWorkspaceSessionsView workspace={workspace} />
    </AppFrame>
  );
}
