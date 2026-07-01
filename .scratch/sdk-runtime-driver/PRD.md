# PRD: Pi SDK Runtime Driver Spike

Status: ready-for-agent
Feature: sdk-runtime-driver
Created: 2026-07-01

> 本 PRD 记录 PiGUI Runtime Gateway 后面的 Pi SDK 集成 spike。当前架构决策以 ADR-0018 为准：SDK 是主路径，RPC 作为隔离/兼容/fallback driver 保留；本 spike 不切默认 driver，不修改 RPC。

## Problem Statement

PiGUI 已经固定 Runtime Gateway API，但正式 App 当前默认仍由 RPC fallback driver 支撑。RPC 可以长期保留为补充路径，但主路线需要验证真实 Pi SDK 是否能支撑 Runtime Gateway 的核心闭环：创建或绑定 Pi session、发送 prompt、接收 runtime event，并读取可重建当前状态的 snapshot。

用户现在面对的问题不是“要不要用 SDK”，这个方向已经确定；真正的问题是：在不影响正式 App、不动 RPC、不污染 Runtime Gateway contract 的前提下，如何用可复跑的证据证明 SDK 能力面是否足够进入下一阶段。

## Solution

做一个 backend-only、显式 opt-in、可复跑的 Pi SDK capability spike。

真实 SDK spike 以 backend CLI harness 为主。它围绕现有 Pi runtime driver contract 执行核心闭环，不接 renderer，不切 Electron 默认 driver，不进入 production composition root。Vitest 继续覆盖 fake runtime、driver contract 和 mapping 逻辑；真实 SDK / 模型调用不能进入默认测试路径。

spike 的最小闭环是：

```text
create_session -> send_prompt -> receive normalized runtime event -> get_runtime_snapshot
```

真实 SDK spike 必须通过环境变量显式启用：

```bash
PIGUI_RUN_PI_SDK_SPIKE=1 bun run ...
```

没有 `PIGUI_RUN_PI_SDK_SPIKE=1` 时，CLI harness 应拒绝运行，并提示它会调用真实 Pi SDK / 可能产生模型调用。

固定 prompt 是：

```text
Reply with exactly: PIGUI_SDK_SPIKE_OK
```

该 prompt 用于验证 message flow，必须保持低成本、无工具调用意图、无文件修改风险。harness 应尝试在 assistant event 或 snapshot 可见文本中找到 `PIGUI_SDK_SPIKE_OK`；如果 SDK 只提供流式或包装后的文本，也应记录最终可见输出作为证据。

## User Stories

1. As a PiGUI developer, I want to validate the Pi SDK behind Runtime Gateway, so that SDK integration proceeds from evidence rather than assumption.
2. As a PiGUI developer, I want the spike to stay backend-only, so that renderer and Electron behavior remain unchanged during capability discovery.
3. As a PiGUI developer, I want RPC fallback/default behavior to remain untouched, so that the current formal App path stays stable while SDK is evaluated.
4. As a PiGUI developer, I want a repeatable SDK spike harness, so that SDK capability can be rechecked after SDK or PiGUI changes.
5. As a PiGUI developer, I want the harness to be opt-in, so that normal test runs do not trigger real SDK/model calls.
6. As a PiGUI developer, I want the harness to clearly refuse running without opt-in, so that accidental model calls are avoided.
7. As a PiGUI developer, I want the spike prompt to be fixed and low-cost, so that runs are comparable and do not invite file edits or tool use.
8. As a PiGUI developer, I want the SDK spike to create or bind a Pi session, so that session creation is verified at the actual SDK boundary.
9. As a PiGUI developer, I want the SDK spike to send a prompt, so that the most basic user action is validated.
10. As a PiGUI developer, I want the SDK spike to receive runtime events, so that live Session UI can eventually depend on SDK-backed event flow.
11. As a PiGUI developer, I want SDK events normalized into Runtime Gateway envelope semantics, so that SDK details do not leak into clients.
12. As a PiGUI developer, I want the SDK spike to read a runtime snapshot, so that reconnect and Projection rebuild scenarios can be evaluated.
13. As a PiGUI developer, I want Runtime Gateway contract to be the pass/fail authority, so that the spike proves PiGUI integration rather than merely SDK invocation.
14. As a PiGUI developer, I want SDK raw state/events retained only as evidence, so that implementation details do not become product protocol.
15. As a PiGUI developer, I want SDK public exports to be the only supported integration surface, so that the spike does not depend on unstable private paths.
16. As a PiGUI developer, I want public API gaps recorded explicitly, so that missing SDK support can be discussed upstream or designed around deliberately.
17. As a PiGUI developer, I want a capability matrix, so that confirmed, partial, missing, unknown, and not-required capabilities are visible at a glance.
18. As a PiGUI developer, I want message identity evidence captured, so that later duplicate-message fixes have real SDK facts.
19. As a PiGUI developer, I want event order evidence captured, so that live projection logic can be designed against actual SDK ordering.
20. As a PiGUI developer, I want session identity evidence captured, so that PiGUI Session Projection can reconnect to the correct Pi session.
21. As a PiGUI developer, I want Queue, Steer, and Stop listed but not required for first pass, so that the spike stays narrow while preserving future scope.
22. As a PiGUI developer, I want usage/cost and model/thinking listed but not required for first pass, so that product-critical telemetry is not forgotten.
23. As a PiGUI developer, I want extension UI request and resource loading listed but not required for first pass, so that future deep SDK integration remains visible.
24. As a PiGUI developer, I want errors and crash recovery listed but not required for first pass, so that reliability gaps are captured without blocking the first proof.
25. As a PiGUI developer, I want fake contract tests to remain separate from true SDK spike runs, so that fast tests remain deterministic.
26. As a PiGUI developer, I want the spike to avoid UI duplicate-message fixes, so that capability discovery does not turn into a broad product bugfix.
27. As a PiGUI developer, I want the spike to avoid Projection dedupe changes, so that Gateway/Projection message identity can be designed separately.
28. As a PiGUI developer, I want a next-stage gate, so that “switch default driver” only starts after concrete capability criteria are met.
29. As a PiGUI developer, I want open SDK/Gateway gaps converted into follow-up issues, so that failed or partial spike results still produce actionable work.
30. As a PiGUI developer, I want the PRD and issues in the repo issue tracker, so that future agents can pick up the work without re-running this conversation.

## Implementation Decisions

- The canonical term is `Runtime Gateway`; `AI Gateway` is not used for this project boundary.
- SDK integration is the primary direction. RPC remains a supplemental isolation/compatibility/fallback driver and is not modified by this spike.
- The spike is backend-only. It does not connect to renderer, Electron default driver selection, or production service composition.
- The spike artifact is a reusable backend CLI harness rather than a one-off scratch script.
- True SDK/model calls are allowed only through explicit opt-in with `PIGUI_RUN_PI_SDK_SPIKE=1`.
- Without the opt-in environment variable, the harness must fail closed with a clear warning.
- The fixed prompt is `Reply with exactly: PIGUI_SDK_SPIKE_OK`.
- The harness should use only public exports from the Pi SDK package. Reading package source for research is allowed, but private deep imports are not accepted as an integration strategy.
- Runtime Gateway snapshot/envelope semantics are the success authority. SDK raw state/event records are supporting evidence.
- If SDK data cannot map stably to Gateway session identity, message identity, event order, or snapshot fields, the result is a capability gap rather than a reason to weaken the Gateway contract.
- The first spike pass only requires create session, send prompt, normalized runtime event, and runtime snapshot.
- Queue, Steer, Stop, usage/cost, model/thinking, extension UI request, resource loading/cwd, auth/model registry, and error/crash recovery are recorded in the capability matrix but do not gate first-pass success.
- The capability matrix status values are `confirmed`, `partial`, `missing`, `unknown`, and `not-required`.
- SDK event identity evidence should include whether stable message id, turn id, event phase, final/delta signal, and ordering are available.
- The spike must not fix Live Chat duplicate messages, must not change Projection dedupe strategy, and must not modify RPC driver behavior.
- Entering the “switch default driver” stage requires the core loop to be confirmed, session identity confirmed, event order at least partial and explainable, message identity at least partial, no Gateway contract pollution, no RPC/default path modifications, and open gaps converted to issues.

## Testing Decisions

- The highest stable automated seam is the Runtime Gateway / Pi runtime driver contract. Tests should assert Gateway-visible behavior, not SDK internals.
- Fake runtime tests should continue to cover driver mapping, unsupported capability errors, snapshot conversion, event normalization, and contract shape.
- The true SDK spike should be a CLI harness, not a default Vitest integration test, because it may use credentials, network, model calls, and time.
- A good test asserts external behavior: Gateway snapshot fields, Gateway event envelope fields, assistant output evidence, status transitions, identity fields, and capability matrix updates.
- Default repository tests must prove that true SDK/model calls are not triggered accidentally.
- The opt-in harness verification should capture raw SDK evidence and Gateway-mapped evidence in a form that can update the capability matrix.
- Prior art exists in the current backend driver tests that use fake runtime/transport adapters to validate driver contract behavior without spawning a real runtime.
- The implementation should prefer existing driver contract tests and Gateway contract tests over introducing many new low-level seams.
- If a new seam is necessary, it should sit at the backend harness boundary rather than leaking into renderer or UI layers.

## Out of Scope

- Switching the formal App default driver to SDK.
- Connecting SDK to renderer or Electron default path.
- Modifying RPC fallback/default behavior.
- Fixing Live Chat duplicate messages.
- Changing Session Projection dedupe behavior.
- Changing Runtime Gateway public contract to fit SDK raw shape.
- Importing SDK private deep paths or undocumented internals.
- Making true SDK/model calls part of default `bun run test`.
- Full Queue, Steer, Stop product integration.
- Full usage/cost, model/thinking, extension UI request, resource loading, auth/model registry, and crash recovery implementation.
- Commit, push, or PR automation for this spike.

## Further Notes

The spike output lives with the repo-local issue tracker under `.scratch/sdk-runtime-driver/`. The capability matrix is part of the deliverable, not a nice-to-have. A failed spike is still useful if it identifies precise SDK public API gaps and maps them to follow-up issues.

This PRD intentionally does not propose a new ADR for switching default drivers. That decision should wait until the spike satisfies the next-stage gate.
