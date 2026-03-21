# 提案：使用异步文件系统操作优化 IPC 模块

**状态**: ✅ 已通过（用户提出特批）
**提案人**: @Jules-Bolt
**受影响的模块**: `src/ipc.ts`

## 1. 背景与问题
在代码库日志分析和性能监控中，我们发现在频繁被调用的函数中使用了同步的文件系统操作。特别是在 `src/ipc.ts` 中的 `readMessage`, `writeMessage`, `readTaskResult`, `writeTaskResult` 函数中使用了 `fs.readFileSync`, `fs.writeFileSync`, 以及 `fs.unlinkSync`。

在高并发或者被重复调用的路径中（比如由 `chokidar` 触发的 `watcher.on`），这些同步的 I/O 操作会阻塞 Node.js 的事件循环。即便单个小文件的读写耗时看似很低，但在高频率触发时，这会导致整体应用延迟上升并阻止 Node.js 及时处理其他异步 I/O 任务。

## 2. 优化方案
为了避免阻塞事件循环，建议将上述同步文件操作替换为 `fs.promises` 提供的异步接口，并调整相关调用方的代码：
- 将 `writeMessage` 改为异步方法，内部使用 `await fs.promises.writeFile`。
- 将 `readMessage` 改为异步方法，使用 `await fs.promises.readFile` 和 `await fs.promises.unlink`，对于文件是否存在的检测，可以使用 `try-catch` 处理 `fs.promises.readFile` 的 ENOENT 错误或者继续使用 `fs.existsSync` 或使用 `fs.promises.access`。考虑到性能，直接进行 `readFile` 并捕获错误是更好的做法，但为了减少改动，可以保留 `existsSync` （因为 `fs.existsSync` 在有缓存时相对不慢，但最好统一改成 `fs.promises`，这里我们用 `await fs.promises.access` 或者捕获 error）。
- 对 `writeTaskResult` 和 `readTaskResult` 做同样的异步化改造。
- 调整 `watchIPC` 中的回调，使其成为 `async` 函数，并加入相应的 `await`。

## 3. 预期收益
- **响应能力提升**: 消除了主线程事件循环中的同步 I/O 阻塞，提升整个 Node.js 应用的并发处理能力。
- **扩展性**: 应对未来可能的大量 IPC 消息或者高频写入，系统将表现出更稳定、低延迟的性能。

## 4. diff 变更说明
- 修改 `writeMessage`，添加 `async` 并使用 `fs.promises.writeFile`。
- 修改 `readMessage`，添加 `async` 并使用 `fs.promises.readFile` 和 `fs.promises.unlink`。
- 修改 `writeTaskResult`，添加 `async` 并使用 `fs.promises.writeFile`。
- 修改 `readTaskResult`，添加 `async` 并使用 `fs.promises.readFile` 和 `fs.promises.unlink`。
- 更新 `watchIPC` 中 `watcher.on("add", async (filePath) => { ... })` 并增加 `await`。
