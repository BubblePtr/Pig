# 采用 apps/packages 多端 Monorepo

Pig 从单包结构迁移为 bun workspaces 多端 Monorepo。这覆盖 [ADR-0014](0014-shared-kernel-core.md) 的"目录先行、第二消费者再升包"分阶段决策——**保留**其 shared-kernel 概念，**翻转**打包时机：第二、三消费者（web、未来 mobile）现在已是**确定意图**，且 `core`/`backend` 的边界经候选 1、2 验证过，"别给未验证边界浇水泥"的反对意见已消解。

## 目标结构

```
apps/
  desktop/      # Electron：FSD renderer + electron 入口 + 启本地 backend
  web/          # 浏览器：同套 web UI，连远程 server（stub，未实现）
  server/       # headless：包 packages/backend + WebSocket transport（stub，未实现）
packages/
  core/         # @pig/core 契约（跨进程/跨端 shared kernel）
  backend/      # @pig/backend 可重定位 server 核心（Electron-free）
```

每个 app 内部用 FSD（`app/pages/entities/shared`）。`mobile`（React Native）记为**未来**消费者：届时把 renderer 的框架无关逻辑抽成共享包，UI 分叉（desktop+web 用 React-DOM，mobile 用 RN）。

## 承重决策

- **一份后端，多处复用**：`packages/backend` 是唯一的后端实现（会话解析 + `pi` 子进程管理 + RPC 协议），desktop 在本地进程跑它、`apps/server` 在远程跑它。**因此 server 用 TS/Node，不用 Go**——Go 会把后端再实现一遍，砸碎"单一可重定位后端"。后端是 I/O 密集（spawn pi / 转 JSONL / relay RPC），Node 长跑无虞。
- **local-as-server 归一**：后端永远是"对自己本地 fs 操作 + 说 RPC 协议"的 server。desktop 在 localhost 启它，VPS 在网络上启它，所有客户端（desktop renderer / web / 未来 mobile）连法一致。这是 local-first daemon 模式。
- **web/mobile ⇒ headless 必需**：浏览器与手机**无法**本地 spawn `pi` 或读 `~/.pi/agent`，所以它们结构上必须连远程后端。这把 [ADR-0013](0013-electron-shell-and-relocatable-backend.md) 的"留缝不建远程"在 web 真开工时**翻转为"建远程"**。
- **安全随暴露面递增（不是平的）**：localhost（无需 auth）→ LAN/隧道（需 auth）→ 公网 VPS（auth + TLS 必需）。auth 设计成按暴露面**条件激活**的层，不假设三处一致。
- **两种远程框架都要**：A=桌面即 server（手机/web 当伴随遥控，数据留本地）；B=云托管（数据上 VPS，是另一个产品）。二者拓扑同构，差异在数据落点与安全等级。

## 本次落地范围

- 建实：bun workspaces + `packages/{core,backend}` 抽出 + `apps/desktop` 跑通（FSD）。
- 建 stub：`apps/{web,server}`（package.json + 占位 + no-op build），形状可见、不写实现。
- 传输不动：desktop 保留 MessagePort；"local-as-server" 在建 `apps/server` 那天实现（协议已传输无关，见 ADR-0013）。

## Consequences

- `@pig/core`、`@pig/backend` 成为真 workspace 包（bun symlink），不再是手写路径 alias。
- renderer 暂留 `apps/desktop/src/`（FSD）；其第二消费者（web）真开工时再抽 `packages/renderer`。
- electron-vite 构建根移到 `apps/desktop`；electron 入口收进 `apps/desktop/electron/`。
- 候选 4（切 agent-workspace 等 mega-module 成 widgets/features）仍推后。
