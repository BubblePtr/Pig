# New Session 先进入 Draft，不立即创建 Runtime Session

用户点击 New Session 或 Project 旁的加号时，PiGUI 进入 Session Draft 状态，而不是立即创建 PiGUI Session 或 Pi Session。此时用户看到的是一个 prompt 输入框，可以输入、修改和暂时离开；PiGUI 应保留这段输入。

Session Draft 只属于 PiGUI UI/本地状态。它是全局唯一的未提交 new-session 输入，并且应跨 app 重启轻量持久化。它可以保存 initial prompt、当前提交目标 Project、model override、checkout override、related directories 等少量高级覆盖项，但不分配 Execution Checkout，不启动 Pi Runtime，不创建 Pi Session State，也不产生 Session Trace。

只有用户提交 prompt 时，PiGUI 才创建真正的 Session：创建或初始化 Session Projection，选择 Execution Checkout，启动或 attach Pi Runtime，创建 Pi Session State，并把 initial prompt 发送给 Pi。

## Consequences

UI 里的 “New Session” 入口不是一个已存在的 Session，而是全局 Session Draft 输入区。Session 列表不应该因为用户点了加号就出现一个空 Session；只有提交后才出现运行中、失败、已结束或可恢复的 Session。

Draft 内容不按 Project 维度分裂。用户切换 Session、切换 Project 或重启 app 后返回时不应丢失；切换 Project 只改变 draft 的提交目标，不清空文本。再次点击 New Session 或 Project 行加号时，应直接打开这份全局 draft，而不是创建新的空 draft，也不弹出替换/继续确认。只有 Pi Runtime 接受 initial prompt 或发出首个 runtime event 后，draft 才清空。

未提交 draft 不展示在左侧 Session 列表，不混入 Session Projection，不进入 Analyze，也不占用 checkout/runtime 资源。UI 可以在 draft 的目标 Project 行显示轻量提示；如果 draft 没有目标 Project，则只在 composer 中提示用户选择 Project。提示可以是小圆点、短 badge 或轻量文案变化，但不能把它表现成一个可恢复 Session。

如果提交失败，PiGUI 应保留 draft 和错误状态，让用户可以重试或修改 prompt。失败发生在 Session 创建之后时，可以留下 failed Session Projection；失败发生在创建 Pi Session 之前时，应仍然停留在 draft 状态。点击发送、创建 Projection 或分配 checkout 都不应立即清空 draft。
