# 提案 035：工具注册表异步文件系统优化

> **状态**: ✅ 已通过（用户提出特批）

## 1. 背景

在 `src/tools/tool-registry.ts` 中，`read_file` 和 `write_file` 工具处理器目前使用了同步的文件读写函数 `readWsFile` 和 `writeWsFile`。这在并发 LLM 请求或处理大型文件时，可能会阻塞 Node.js 的事件循环，导致性能瓶颈。

## 2. 目标

将 `src/tools/tool-registry.ts` 中的文件读写操作从同步改为异步，以避免阻塞事件循环。

## 3. 实施方案

- 在 `src/tools/tool-registry.ts` 中，引入并替换 `readWsFile` 为 `readWsFileAsync`，`writeWsFile` 为 `writeWsFileAsync`。
- 在 `read_file` 和 `write_file` 的处理器中，使用 `await` 调用这些异步函数。
- 确保测试套件通过。

## 4. 预期影响

- 提高文件读写处理器的并发性能。
- 防止由于慢速磁盘或大文件导致 Node.js 事件循环阻塞。
