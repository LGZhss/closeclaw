# 提案：在工具注册表中使用异步文件 I/O 提高性能

> **状态**: ✅ 已通过（用户特批）

## 问题

目前在 `src/tools/tool-registry.ts` 中处理 `read_file` 和 `write_file` 工具调用时，使用了同步方法 `readWsFile` 和 `writeWsFile`。在高并发情况下，这会阻塞 Node.js 的事件循环，降低整体性能。

## 解决方案

将 `readWsFile` 和 `writeWsFile` 替换为异步的 `readWsFileAsync` 和 `writeWsFileAsync`，并使用 `await` 调用，释放事件循环以处理其他请求。
