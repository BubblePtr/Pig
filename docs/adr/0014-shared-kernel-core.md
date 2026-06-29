# 领域契约收进 shared-kernel core（`@pigui/core`）

PiGUI 的 ubiquitous-language 契约类型此前散落在 UI 模块里（`session-detail.tsx`、`setup.tsx`、`sessions.ts`、`pi-runtime-bridge.ts`），且 utilityProcess 后端（`src/backend/*`）跨进程边界**反向 import 渲染层 UI 文件**去取这些类型。本决策把"跨 seam 共享的契约"抽进一个独立 module `@pigui/core`，渲染层与后端都依赖它、互不依赖。

## 边界：shared kernel，不是 domain core

core 只放**真正跨进程 seam 被共享的契约**——即后端 import 的那些类型及其传递依赖：

- 会话数据契约：`SessionSummary` / `SessionDetail` / `SessionTurn` / `Title` / `ModelUsage` / `NamedCount` 等
- 配置契约：`ConfigInventory` / `ExtensionInfo` / `SkillInfo` / `TemplateInfo`
- Pi RPC 协议：`PiRpcCommand` / `PiRpcResponse` / `PiRpcRawEvent` / `PiRpcTransport` / `PiRpcTransportStartInput`
- checkout 端口：`ExecutionCheckoutGitClient`

**不进 core**：只有单一运行时消费的纯领域行为与类型——解析器（后端）、用量聚合 / projection / creation 状态机（渲染层）、以及只有渲染层使用的 Pi 运行时领域模型（`PiSessionState`、`PiRuntimeEvent`、`PiRuntimeBridge` 端口、`ExecutionCheckout` 等）。它们各自属于自己那侧的运行时层。

理由：把"未被两个进程共享的东西"放进 shared kernel，与"过早造一个包"是同一个早熟错误，只是低一层。触发器一致——当第二个消费者（如 CLI）也需要某块逻辑时，它才升级为 shared kernel 进 core。

## 物理形态：目录先行，第二消费者再升包

core 现在是 `src/core/`（带 `index.ts` barrel 作为唯一 public 面），通过 alias `@pigui/core` 被消费，不是一个 workspace 包。

- 触发真包的条件是出现第二个**独立**消费者（CLI，或 ADR-0013 的远期 headless server），不是时间。
- 在那之前，包只是开销（bun workspaces、tsconfig project references、跨构建目标 resolve），换不到杠杆——当前只有一个 app、两个构建目标，它俩本就都读 `src/`。
- 升级路径机械无痛：`git mv src/core packages/core` + 加 package.json，因为 import 边界与 barrel 此时已就位；alias 已用未来包名 `@pigui/core`，连改名都省。

## Consequences

- **import 单向**：渲染层 → core、后端 → core，**两侧互不 import**。后端不再 import 任何 `src/*.tsx`。
- barrel `src/core/index.ts` 是 core 的唯一 public interface；外部不深 import `@pigui/core/...` 内部文件。
- alias 配三处保持一致：`tsconfig.json`（tsc/IDE）、`electron.vite.config.ts`（app 构建）、`vite.config.ts`（vitest）。
- 旧定义文件改为从 `@pigui/core` import 并对存量 UI 消费者再导出；契约的权威定义只在 core。
- 候选 2（拆 `pi-runtime-bridge` 的 real adapter 与 fake）、候选 3（粗粒度 FSD 分层）建立在此 core 之上。
