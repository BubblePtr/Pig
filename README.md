# PiGUI

> A GUI control plane for [Pi Agent](https://pi.dev) — making the CLI's runtime no longer a black box.

PiGUI is a desktop control plane for the Pi coding agent: it creates, starts, observes, and manages Pi agent workspaces, and replays each session as a legible timeline with cost and token truth. Pi remains the only runtime and owns session truth; PiGUI drives it through a stable Runtime Gateway API whose backend driver can use the Pi SDK or a Pi RPC subprocess depending on isolation and deployment needs.

After a session, PiGUI lets you answer — in seconds — the three questions the terminal hides:

- **How much did this cost?**
- **Which step was expensive?**
- **What was Pi actually thinking?**

## Status

🛠️ **Under active development.** The Electron shell, the Runtime Gateway API, the RPC process driver, the Pi SDK driver spike, and the agent-workspace foundation (sessions, run controls, runtime projections) have landed; usage and config surfaces are in flight.

The product began as a passive session-replay tool and has since evolved into an **Agent Workspace Control Plane** for Pi (see [`docs/adr/0001`](docs/adr/0001-agent-workspace-control-plane.md)). The living source of truth is the domain glossary and the ADRs:

- **Glossary:** [`CONTEXT.md`](CONTEXT.md)
- **Decisions:** [`docs/adr/`](docs/adr/) (`0001`–`0018`)
- **Feature PRDs:** [`.scratch/<feature>/PRD.md`](.scratch/) (point-in-time planning records)

## Scope

PiGUI organizes Pi's runtime into a desktop control plane: create and drive **Sessions** under a **Project**, replay each **Session Trace** as a legible timeline with cost and token truth, and view cross-session **usage** and **config**. An embedded browser with DOM annotation is planned (the load-bearing reason for the Electron shell). A full terminal emulator and file tree are deliberately deferred.

## Planned stack

- **Shell:** Electron — a thin `main` process, a Node `utilityProcess` backend (session-log parsing + Pi runtime driver management), and a React renderer (see [`docs/adr/0013`](docs/adr/0013-electron-shell-and-relocatable-backend.md))
- **Frontend:** Vite + React + TypeScript SPA, TanStack (Query/Table/Virtual/Router)
- **Styling:** CSS-variable design tokens (single source of truth) → Tailwind v4 → own component primitives

## Architecture principle

**The dashboard must never stall the engine.** Pi owns session truth; PiGUI observes and steers it through a stable Runtime Gateway API. The backend lives in a `utilityProcess` so runtime crashes and heavy parsing work never freeze the window, and the same backend protocol can later be relocated behind a remote transport without touching business code.

---

Built in public by [@Kieran](https://github.com/BubblePtr).
