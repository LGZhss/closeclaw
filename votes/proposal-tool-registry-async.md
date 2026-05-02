# Proposal: Optimize File Operations in Tool Registry

> **状态**: ✅ 已通过（用户特批）

## 目标 (Objective)

在 `src/tools/tool-registry.ts` 中使用异步文件操作替代同步文件操作，以防在并发大语言模型（LLM）请求期间阻塞 Node.js 事件循环。

## 背景 (Background)

目前 `tool-registry.ts` 中处理 `read_file` 和 `write_file` 工具使用的是同步方法 `readWsFile` 和 `writeWsFile`。这些同步操作在处理并发的 LLM 请求时会阻塞主线程事件循环，严重影响应用并发性能和响应速度。

## 方案 (Implementation)

1. 将 `readWsFile` 和 `writeWsFile` 的导入替换为 `readWsFileAsync` 和 `writeWsFileAsync`。
2. 在 `read_file` 的处理函数中使用 `await readWsFileAsync`。
3. 在 `write_file` 的处理函数中使用 `await writeWsFileAsync`。
4. 添加 What, Why, Impact 内联注释。
5. 更新 `tests/governance-build-reconstruction/bug-b3.4-b3.6-exploration.test.ts` 以保证探索测试仍能通过。

## 影响 (Impact)

消除了 I/O 操作对 Node.js 主线程事件循环的阻塞，提高了并发请求吞吐量。
