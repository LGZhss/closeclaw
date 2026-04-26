# Proposal: 优化工具注册表中的 I/O 操作

> **状态**: ✅ 已通过（用户特批）

**提案者**: Bolt
**日期**: 2026-04-26

## 变更内容
将 `src/tools/tool-registry.ts` 中的同步文件读写操作 (`readWsFile`, `writeWsFile`) 替换为异步文件读写操作 (`readWsFileAsync`, `writeWsFileAsync`)。

## 动机
在 Node.js 中，同步 I/O 会阻塞事件循环。由于工具处理程序本身就是异步的 (`async`) 并且可能在并发的 LLM 请求中被大量调用，使用同步 I/O 会导致整个服务的吞吐量下降。切换到异步 I/O 可以提高并发处理能力并降低响应延迟。

## 影响
提高了工具调用的并发性能，减少了事件循环阻塞时间。
