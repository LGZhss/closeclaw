# 提议：在工具注册表中使用异步文件操作

> **状态**: ✅ 已通过（用户特批）

**背景**：目前 `src/tools/tool-registry.ts` 中 `read_file` 和 `write_file` 处理器使用同步的文件操作 (`readWsFile`, `writeWsFile`)。

**问题**：由于 Node.js 的单线程特性，同步的 I/O 会阻塞整个事件循环，这会在处理高并发 LLM 请求时导致严重的性能下降。

**解决方案**：将 `readWsFile` 替换为 `readWsFileAsync`，将 `writeWsFile` 替换为 `writeWsFileAsync`，并在调用时使用 `await`。

**影响**：大幅提高并发请求吞吐量和应用的整体响应速度，确保事件循环不被磁盘 I/O 阻塞。
