# Proposal: Migrate to Asynchronous File Operations in Tool Registry

> **状态**: ✅ 已通过（用户特批）

## 1. 提案背景

在 `src/tools/tool-registry.ts` 中，`read_file` 和 `write_file` 的工具处理函数当前使用的是同步文件系统操作 (`readWsFile` 和 `writeWsFile`)。在高并发请求时（例如多个并发 LLM 请求同时访问文件），同步 I/O 会阻塞 Node.js 的主事件循环，严重影响整体性能和吞吐量。

## 2. 修改范围

1. **`src/tools/tool-registry.ts`**
   - 将 `readWsFile` 替换为 `readWsFileAsync`，并正确使用 `await`。
   - 将 `writeWsFile` 替换为 `writeWsFileAsync`，并正确使用 `await`。

2. **`tests/governance-build-reconstruction/bug-b3.4-b3.6-exploration.test.ts`**
   - 修复由于子字符串匹配 (`toContain("readWsFile")`) 导致的检查不准确的问题，将测试改为验证 `readWsFileAsync` 和 `writeWsFileAsync`，并使用正则表达式词边界检查。

3. **`.jules/bolt.md`**
   - 记录相关性能优化学习经验。

## 3. 预期影响

- 提升高并发场景下工具处理性能，防止同步文件 I/O 阻塞事件循环。
