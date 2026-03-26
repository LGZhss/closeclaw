✅ 已通过（用户提出特批）

# 提案 026：将 Sandbox 执行器中的同步文件操作改为异步 (Async Sandbox FS)

## 当前性能瓶颈

在 `src/sandbox/process-executor.ts` 的 `ProcessExecutor.execute` 和 `_executeProcess` 方法中，使用了 Node.js 的同步文件系统 API：`fs.writeFileSync`, `fs.unlinkSync`, `fs.existsSync`。
当在高并发或循环中执行沙盒代码时，这些同步文件 I/O 操作会阻塞 Node.js 的事件循环。即使单个小文件的读写延迟在毫秒级别，但在系统负载增加时，同步操作将导致整个事件循环停滞，严重影响系统的并发处理能力和整体响应性能。

## 优化思路

为了释放主线程并避免阻塞事件循环，我们将所有沙盒临时文件的同步操作迁移到异步的基于 Promise 的 API。
由于 `execute` 方法已经是 `async`，我们可以直接内部 `await` 文件操作，而不需要嵌套回调：
- 将 `fs.writeFileSync(tempFile, code)` 替换为 `await fs.promises.writeFile(tempFile, code)`
- 将 `fs.unlinkSync(tempFile)` 替换为 `await fs.promises.unlink(tempFile)`（放入 try/catch 以防止文件不存在时的错误）。
- 将 `fs.existsSync(tempPath)` 等逻辑替换为直接 `try { await fs.promises.unlink(tempPath) } catch {}`，因为我们在清理临时文件时只需要保证文件被删除即可，无需检查是否存在。
- 在 `_executeProcess` 函数内 `childProcess.on('error')` 等回调中产生的清理逻辑由于无法直接使用 `await`，可改写为 `fs.promises.unlink(...).catch(() => {})` 以非阻塞的方式进行垃圾回收。

## 预期的 Diff 变更

- 修改 `src/sandbox/process-executor.ts`。
- 将引入 `import { promises as fsPromises } from 'fs';` 或直接使用 `fs.promises`。
- 修改 `ProcessExecutor.execute` 中的 `fs.writeFileSync` 为 `await fs.promises.writeFile`。
- 修改临时文件的清理，改用 `fs.promises.unlink` 的异步清理逻辑。
- 确保清理操作的容错处理不受影响。

---
`Proposal-By`: Google Labs Jules (Bolt)
`Implemented-By`: Google Labs Jules (Bolt)