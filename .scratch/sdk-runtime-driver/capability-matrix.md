# Pi SDK Runtime Driver Capability Matrix

Status: ready-for-agent
Source PRD: `.scratch/sdk-runtime-driver/PRD.md`
Created: 2026-07-01

| Capability | Status | Evidence | Notes |
| --- | --- | --- | --- |
| create_session | confirmed | Opt-in CLI run created Pi session `019f1c24-845f-7384-b560-b0431aa75f09`. | Gateway snapshot returned `sessionId=sdk-spike-session`, `runtimeId=pi-sdk:sdk-spike-session`. |
| send_prompt | confirmed | `send_prompt accepted by Runtime Gateway`. | Fixed prompt was `Reply with exactly: PIGUI_SDK_SPIKE_OK`; SDK was started with `noTools: "all"`. |
| receive normalized runtime event | confirmed | Gateway assistant message stream contained `PIGUI_SDK_SPIKE_OK`. | Harness aggregates assistant message fragments across Gateway envelopes before judging success. |
| get_runtime_snapshot | confirmed | Snapshot status was `completed`, cwd was `/Users/void/code/opensource/Pig`. | Snapshot was returned through Runtime Gateway, not from SDK raw state alone. |
| session identity | confirmed | Snapshot and Gateway events used Pi session `019f1c24-845f-7384-b560-b0431aa75f09`. | Runtime Gateway identity mapping passed for the spike run. |
| message identity | partial | Gateway user event used `pi-sdk:019f1c24-845f-7384-b560-b0431aa75f09:user:0`; assistant events used stable `pi-sdk:019f1c24-845f-7384-b560-b0431aa75f09:assistant:0` with `bodyFormat=full`. | SDK public events did not provide stable raw message ids, so PiGUI defines synthetic Gateway message ids. This is enough to avoid duplicate user prompt and assistant token/final duplication in backend normalization; Projection still needs to consume `messageId/bodyFormat` for UI replacement. |
| event order | confirmed | Opt-in CLI summary reported `eventCount=48`, `eventSeqRange=1..48`; message sample starts with user seq 1, assistant seq 2+. | Gateway sequencer order was strictly increasing. |
| Queue | partial | Public `.d.ts` exposes `followUp()`, `clearQueue()`, `pendingMessageCount`, `getSteeringMessages()`, `getFollowUpMessages()`, and `queue_update`; backend adapter tests map `queue_follow_up`, `queue_update`, and best-effort `withdraw_queued_message`. | Gateway now creates synthetic queued ids and withdraws by `clearQueue()` + replay-all-except-target. SDK still exposes pending queues as strings, not stable queued item ids, so duplicate-body withdraw remains best-effort and true streaming queue behavior is not yet opt-in verified. |
| Steer | partial | Public `.d.ts` exposes `steer()` and `prompt(..., { streamingBehavior: "steer" })`; backend driver/adapter tests map Runtime Gateway `steer_run` to `session.steer()` and emit a control event. | Runtime Gateway backend mapping is implemented. True live interruption semantics during a long streaming run are still not opt-in verified. |
| Stop | partial | Public `.d.ts` exposes `abort()`; backend adapter maps `stopRun()` to `session.abort()` and snapshot status; driver emits a `Stopped` status event. | Runtime Gateway backend mapping is implemented. True abort behavior during a long streaming run is still not opt-in verified. |
| usage/cost | confirmed | Opt-in CLI run mapped real SDK `getSessionStats()` into snapshot summary: `totalTokens=1343`, `totalCostUsd=0.000045530000000000006`. | Runtime Gateway `summary.totalTokens` / `summary.totalCostUsd` mapping is confirmed for the SDK-backed adapter. |
| model/thinking | partial | Opt-in CLI run mapped real SDK model identity into snapshot summary: `provider=deepseek`, `model=deepseek-v4-pro`; backend tests map `thinking_level_changed` into a Gateway `model_update` event. | Snapshot/event mapping exists. Runtime Gateway does not yet define model/thinking control commands, so `setModel()` / `cycleModel()` / `setThinkingLevel()` are not exposed as product commands. |
| extension UI request | missing | SDK/RPC docs expose an `extension_ui_request` sub-protocol and `createAgentSession()` returns `extensionsResult`, but `AgentSessionEvent` does not surface extension UI requests through the SDK event stream used by this adapter. | PiGUI needs a Runtime Gateway extension-UI protocol or an SDK runtime binding layer before this can work. |
| resource loading / cwd | partial | Opt-in CLI snapshot confirmed `cwd=/Users/void/code/opensource/Pig`; backend adapter tests pass `resourceLoader` through `createAgentSession()`. | `cwd` and injection mapping are covered. Full skills/extensions/prompts/context discovery behavior is not yet product-verified. |
| auth/model registry | partial | Public `CreateAgentSessionOptions` exposes `authStorage` and `modelRegistry`; backend adapter tests pass explicit `authStorage` / `modelRegistry` through; opt-in CLI succeeded with default auth/model resolution. | Explicit unavailable-auth error mapping is not yet covered. |
| error and crash recovery | partial | Public `AgentSessionEvent` includes `auto_retry_start`, `auto_retry_end`, `compaction_start`, `compaction_end`; backend adapter tests map retry/compaction events to Gateway status events and read `agent.state.errorMessage` for failed snapshot status. | SDK in-process crash/restart recovery is not equivalent to subprocess RPC recovery; crash strategy still needs a separate design. |

## Status Values

- `confirmed`: true SDK call and Runtime Gateway mapping both passed.
- `partial`: SDK has the capability, but Gateway mapping, identity, order, or snapshot evidence is incomplete or unstable.
- `missing`: SDK does not expose a usable capability, or the harness cannot access it.
- `unknown`: not verified yet.
- `not-required`: intentionally listed but not required for the first spike pass. Prefer `partial` once public SDK/API evidence has been inspected.

## Evidence Rules

- Use Runtime Gateway snapshot/envelope fields as the pass/fail evidence.
- SDK raw state/event can be cited as supporting evidence, but cannot be the only success signal.
- If SDK data cannot map stably to Gateway session identity, message identity, event order, or snapshot fields, mark the capability as `missing` or `partial`.
- The fixed spike prompt is `Reply with exactly: PIGUI_SDK_SPIKE_OK`; assistant event or snapshot text containing `PIGUI_SDK_SPIKE_OK` is the message-flow success evidence.

## Latest Run

Command:

```bash
PIGUI_RUN_PI_SDK_SPIKE=1 bun packages/backend/scripts/spike-pi-sdk-driver.ts
```

Result on 2026-07-01:

- `ok=true`
- `eventCount=37`
- `eventSeqRange=1..37`
- `snapshot.status=completed`
- `snapshot.cwd=/Users/void/code/opensource/Pig`
- `snapshot.summary.provider=deepseek`
- `snapshot.summary.model=deepseek-v4-pro`
- `snapshot.summary.totalTokens=1343`
- `snapshot.summary.totalCostUsd=0.000045530000000000006`
- `usage_cost=confirmed`
- `model_thinking=partial`
- `resource_loading_cwd=partial`
- `message_identity=partial`
- `messageSamples[0].role=user`, `messageSamples[0].messageId=pi-sdk:019f1ca7-9baa-734c-8f3e-f893eb49e9f1:user:0`
- assistant samples use `messageId=pi-sdk:019f1ca7-9baa-734c-8f3e-f893eb49e9f1:assistant:0`, `bodyFormat=full`, and monotonically growing `body`

Fail-closed command:

```bash
bun packages/backend/scripts/spike-pi-sdk-driver.ts
```

Result on 2026-07-01:

- `ok=false`
- `enabled=false`
- `reason=not-enabled`

Backend mapping verification:

```bash
bunx vitest run packages/backend/src/pi-sdk-runtime-adapter.test.ts packages/backend/src/pi-sdk-driver.test.ts packages/backend/src/pi-sdk-spike.test.ts
bun run test
bun run typecheck
git diff -- packages/backend/src/service.ts packages/backend/src/pi-rpc-driver.ts
```

Result on 2026-07-01:

- targeted SDK mapping tests: `3 passed`, `19 passed`
- default `bun run test`: `34 passed`, `227 passed`
- `tsc --noEmit` passed
- RPC/default driver diff was empty

## Non-Gating Public API Inspection

The extended rows above were inspected against public SDK docs/types on 2026-07-01 and backed by backend-only adapter/driver tests. Rows stay `partial` when the SDK surface and Gateway backend mapping exist but true long-running streaming behavior, stable SDK identity, UI sub-protocol handling, or crash recovery semantics remain incomplete.
