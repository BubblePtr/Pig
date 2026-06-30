# Project Registry 与 Draft 模型分离

PiGUI 的 Project 不从历史 session、cwd 或文件系统扫描中自动发现，而是由用户手动添加到本地 Project Registry；sidebar 和 composer 的 Project 选择都消费同一个 registry。这个选择牺牲了自动发现的便利，换取更可控的运行 cwd 和更清晰的用户意图：只有用户显式加入的本地目录才成为可创建 Session 的 Project。

## Consequences

Project Registry 属于 PiGUI 本地 app state，不写入项目 repo、Pi Runtime truth 或 Pi session logs。Project identity 首版使用规范化绝对路径，列表按添加时间倒序展示，用户可以从 sidebar 移除 Project，但不会删除本地目录或历史 Session。

New Session 使用全局唯一的 Session Draft，而不是每个 Project 一份 draft。Project 只是 draft 的当前提交目标，用户在 composer 中切换 Project 时保留 draft 文本；已有 Session 的未提交输入另建 Follow-up Draft，按 Session 保存，避免和创建新 Session 的草稿混淆。
