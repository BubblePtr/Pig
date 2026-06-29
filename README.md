# Pig

> A GUI control plane for [Pi Agent](https://pi.dev) — making the CLI's runtime no longer a black box.

Pig is a desktop control plane for the Pi coding agent: it creates, starts, observes, and manages Pi agent workspaces, and replays each session as a legible timeline with cost and token truth. Pi remains the only runtime and owns session truth — Pig drives it as an **isolated subprocess** over a transport-agnostic RPC protocol, never embedding the agent in-process. The dashboard must never be able to stall the engine.

After a session, Pig lets you answer — in seconds — the three questions the terminal hides:

- **How much did this cost?**
- **Which step was expensive?**
- **What was Pi actually thinking?**

## Status

🪧 **Planning complete — implementation not yet started.**

This repository currently holds the planning scaffold, not application code. The V1 design was settled through a structured interview and decomposed into a PRD and six vertical-slice issues.

- **PRD:** [`.scratch/v1-session-replay/PRD.md`](.scratch/v1-session-replay/PRD.md)
- **Issues:** [`.scratch/v1-session-replay/issues/`](.scratch/v1-session-replay/issues/) (`01`–`06`, dependency-ordered tracer bullets)

## V1 scope

A single vertical slice: **global recent-session list → single-session detail** (foldable annotated timeline + per-step cost/token badges). Cross-session dashboard, plugin management, and live tailing are deliberately deferred.

## Planned stack

- **Shell:** Electron — a thin `main` process, a Node `utilityProcess` backend (session-log parsing + `pi` subprocess management), and a React renderer (see [`docs/adr/0013`](docs/adr/0013-electron-shell-and-relocatable-backend.md))
- **Frontend:** Vite + React + TypeScript SPA, TanStack (Query/Table/Virtual/Router)
- **Styling:** CSS-variable design tokens (single source of truth) → Tailwind v4 → own component primitives

## Architecture principle

**The dashboard must never stall the engine.** Pi owns session truth and runs as an isolated subprocess; Pig observes and steers it over a single transport-agnostic RPC protocol. The backend lives in a `utilityProcess` so a runtime crash never freezes the window — and so the same backend can later be relocated behind a remote transport without touching business code.

---

Built in public by [@Kieran](https://github.com/BubblePtr).
