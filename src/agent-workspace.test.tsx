import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { AgentWorkspaceSessionsPage } from "./agent-workspace";

function renderProjectSessions(path = "/projects/pig/sessions") {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });
  const sessionsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/projects/$projectId/sessions",
    component: AgentWorkspaceSessionsPage,
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [path] }),
    routeTree: rootRoute.addChildren([sessionsRoute]),
  });

  return render(<RouterProvider router={router} />);
}

describe("AgentWorkspaceSessionsPage", () => {
  it("renders a Project-scoped Sessions view with Live Chat and the action surface", async () => {
    const user = userEvent.setup();

    const { container } = renderProjectSessions();

    const sessionsView = await screen.findByTestId("project-sessions-view");

    expect(within(sessionsView).queryByText("Project Workspace")).not.toBeInTheDocument();
    expect(within(sessionsView).queryByText(/Pig keeps live Pi work/)).not.toBeInTheDocument();
    expect(within(sessionsView).queryByText("Live Session View")).not.toBeInTheDocument();
    expect(within(sessionsView).queryByText(/Messages and run activity/)).not.toBeInTheDocument();

    const liveColumn = screen.getByTestId("live-session-column");
    const navbarActions = screen.getByTestId("navbar-actions");

    expect(screen.getByTestId("sidebar-projects")).toBeInTheDocument();
    expect(
      within(sessionsView).queryByTestId("project-session-list-column"),
    ).not.toBeInTheDocument();
    expect(
      within(sessionsView).queryByTestId("structured-action-surface-column"),
    ).not.toBeInTheDocument();
    expect(within(liveColumn).queryByRole("heading", { name: "Live Chat" })).not.toBeInTheDocument();
    expect(within(liveColumn).queryByRole("heading", { name: "Run timeline" })).not.toBeInTheDocument();
    expect(within(liveColumn).queryByRole("button", { name: "Session actions" })).not.toBeInTheDocument();
    expect(liveColumn).toHaveClass("h-full");
    const sessionActionsButton = within(navbarActions).getByRole("button", {
      name: "Session actions",
    });
    const chatConversation = liveColumn.querySelector('[data-slot="chat-conversation"]');
    const promptInput = liveColumn.querySelector('[data-slot="prompt-input"]');

    expect(sessionActionsButton).toBeInTheDocument();
    expect(container.querySelector('[data-slot="navbar-spacer"]')).toHaveAttribute(
      "data-tauri-drag-region",
    );
    expect(chatConversation).toBeInTheDocument();
    expect(chatConversation).toHaveAttribute("role", "log");
    expect(
      liveColumn.querySelector('[data-slot="chat-conversation-content"]'),
    ).toBeInTheDocument();
    expect(liveColumn.querySelectorAll('[data-slot="chat-message-user"]')).toHaveLength(1);
    expect(liveColumn.querySelectorAll('[data-slot="chat-message-assistant"]')).toHaveLength(1);
    expect(liveColumn.querySelectorAll('[data-slot="chat-message-bubble"]')).toHaveLength(1);
    expect(liveColumn.querySelectorAll('[data-slot="chat-message-body"]')).toHaveLength(1);
    expect(liveColumn.querySelectorAll('[data-slot="chat-message-content"]')).toHaveLength(2);
    expect(liveColumn.querySelectorAll('[data-slot="chat-message-avatar"]')).toHaveLength(1);
    expect(liveColumn.querySelector('[data-slot="chain-of-thought"]')).toBeInTheDocument();
    expect(liveColumn.querySelectorAll('[data-slot="chain-of-thought-step"]')).toHaveLength(3);
    expect(within(liveColumn).getByText("Project context loaded")).toBeInTheDocument();
    expect(promptInput).toBeInTheDocument();
    expect(liveColumn.querySelector('[data-slot="prompt-input-shell"]')).toBeInTheDocument();
    expect(liveColumn.querySelector('[data-slot="prompt-input-textarea"]')).toBeInTheDocument();
    expect(liveColumn.querySelector('[data-slot="prompt-input-send"]')).toBeInTheDocument();
    expect(within(liveColumn).getByPlaceholderText("What do you want to know?")).toBeInTheDocument();
    expect(within(liveColumn).getByRole("button", { name: "Send" })).toBeInTheDocument();
    expect(within(liveColumn).getByText("AI can make mistakes. Check important info.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Session actions" })).not.toBeInTheDocument();

    await user.click(sessionActionsButton);

    const actionDialog = await screen.findByRole("dialog", { name: "Session actions" });
    const sheetContent = document.querySelector('[data-slot="sheet-content"]');

    expect(sheetContent).toHaveStyle({
      animation: "none",
      transform: "translate3d(0, 0, 0)",
    });
    expect(within(actionDialog).getByText("Diff summary")).toBeInTheDocument();
    expect(within(actionDialog).getByText("Checkout")).toBeInTheDocument();
    expect(within(actionDialog).getByText("gpt-5-codex")).toBeInTheDocument();
    expect(within(actionDialog).getByText("$0.042137")).toBeInTheDocument();
  });

  it("does not expose deferred terminal, file tree, or runtime control placeholders", async () => {
    renderProjectSessions();

    const sessionsView = await screen.findByTestId("project-sessions-view");

    expect(within(sessionsView).queryByText(/terminal/i)).not.toBeInTheDocument();
    expect(within(sessionsView).queryByText(/file tree|file explorer/i)).not.toBeInTheDocument();
    expect(
      within(sessionsView).queryByRole("button", { name: /queue|steer|stop/i }),
    ).not.toBeInTheDocument();
  });

  it("does not leak implementation placeholder copy into the product UI", async () => {
    renderProjectSessions();

    const sessionsView = await screen.findByTestId("project-sessions-view");

    expect(
      within(sessionsView).queryByText(
        /fixture|slice|not connected|future slices|projection|CONTEXT\.md|PRD|ADR/i,
      ),
    ).not.toBeInTheDocument();
  });
});
