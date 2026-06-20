# Pig

> A passive flight recorder for [Pi Agent](https://pi.dev) — making the CLI's runtime no longer a black box.

Pig is a desktop companion for the Pi coding agent. It does **not** launch or host Pi, and it is **not** an AI developer environment. You keep using `pi` in your terminal; Pig sits beside it as a pane of glass, reading Pi's session logs and replaying each session as a legible timeline with cost and token truth.

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

- **Shell:** Tauri (Rust backend does parsing/scanning/aggregation; web frontend does rendering)
- **Frontend:** Vite + React + TypeScript SPA, TanStack (Query/Table/Virtual/Router)
- **Styling:** CSS-variable design tokens (single source of truth) → Tailwind v4 → own component primitives

## Architecture principle

Pig is a **passive observer**, orthogonal to Pi's process and protocol. Every feature is weighed against one question: *does it break the pure-observer purity?* That is why writes (plugin management) and live `fs.watch` are out of V1.

---

Built in public by [@Kieran](https://github.com/BubblePtr).
