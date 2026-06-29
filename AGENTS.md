# Pig — Agent Instructions

> Canonical agent instructions for this repo, shared across all runtimes (Pi, Claude Code, and any other agent). `CLAUDE.md` imports this file — edit here, not there.

Pig is a GUI control plane for the Pi coding agent. It creates, starts, observes, and manages Pi agent workspaces — and replays each session as a legible timeline with cost and token truth. It drives Pi as an isolated subprocess (Pi owns session truth; Pig observes and steers it over a transport-agnostic RPC protocol). The desktop shell is Electron (`utilityProcess` backend + React renderer; see `docs/adr/0013-electron-shell-and-relocatable-backend.md`). For product scope and decisions, read `README.md` and `.scratch/v1-session-replay/PRD.md`.

## Agent skills

### Issue tracker

Issues live in **Multica** (the agent-orchestration platform driving the EverWard Works squad), managed via the `multica` CLI — native statuses track execution, the five triage roles are applied as labels. PRDs stay in-repo under `.scratch/<feature>/PRD.md`. See `docs/agents/issue-tracker.md`.

### Triage labels

The default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), applied as Multica labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
