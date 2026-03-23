# P027 Phase 2 Part 1: Go Kernel 接管 `router.ts`
> 🎯 **目标**: 将原有的 TS 层消息路由判断、Prompt 拼接（`src/router.ts`）完全转移到 Go 内核中执行。

## 1. 业务上下文分析
旧版 `src/router.ts` 主要职责：
1. `shouldTrigger`: 基于正则表达式判断是否唤醒智能体。
2. `getMessagesSince` / `markMessagesProcessed`: 结合 db 操作检索。
3. `buildAgentPrompt`: 拼接 Prompt，进行 XML 转义和时间格式化（使用了 Intl 缓存优化）。
4. `processGroupMessages`: 取出消息 -> 判断是否 trigger -> 设置 router_state -> 发送请求给 LLM。

## 2. 实施方案
在 Go 侧建立对等的路由解析库：`kernel/router`
- 将原正则过滤翻译为 Go 的 `regexp` 匹配。
- 将 `buildAgentPrompt` 用 `text/template` 或字符串拼接在 Go 中重建。
- 由于 SQLite WAL 已经在 `kernel/db` 就绪，直接在 Go 端完成“读取 -> 构筑 Prompt -> 标记已读”的微纳秒级事务，彻底砍掉 Node.js 的 DB 读写权。

## 3. 验收标准
- [ ] 创建 `kernel/router/router.go` 实现完整消息筛选和 Prompt 构建功能。
- [ ] 创建 `kernel/router/router_test.go`，确保 XML 转义与 Prompt 还原度 100% 对齐原 TS 逻辑（特别是 Intl.DateTimeFormat 时间戳的毫秒级精度字符串）。
- [ ] 集成进 `kernel/server/ipc.go` 的 RPC 接口。
