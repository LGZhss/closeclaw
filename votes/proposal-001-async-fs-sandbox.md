✅ 已通过（用户提出特批）

# 提案 001: Sandbox Process Executor 异步文件系统优化

## 提案人
@Jules-Bolt

## 目前的性能瓶颈
在 `src/sandbox/process-executor.ts` 中，沙箱在每次执行代码时会通过 `fs.writeFileSync` 写入临时文件，并在执行结束后通过 `fs.unlinkSync`（有时结合 `fs.existsSync`）删除临时文件。
当系统面临高并发请求（例如多个 agents 同时被调度或并发测试大量代码段）时，同步的 I/O 操作会阻塞 Node.js 的主事件循环。这会导致整个系统的吞吐量下降，并在极端情况下增加其他异步操作（例如网络请求处理、IPC 消息传递）的延迟。

## 优化思路
将 `src/sandbox/process-executor.ts` 中的文件系统操作从同步改为异步：
- 使用 `fs.promises.writeFile` 替换 `fs.writeFileSync`。
- 使用 `fs.promises.unlink` 替换 `fs.unlinkSync`。
- 使用 `fs.promises.stat` 替代 `fs.existsSync` 判断文件是否存在（或在某些捕获块中直接尝试 `unlink` 并忽略 ENOENT 错误）。
这样可以允许 Node.js 的事件循环在等待磁盘 I/O 的过程中继续处理其他任务。

## 预期的 Diff 变更
`src/sandbox/process-executor.ts` 中的 `execute` 和 `_executeProcess` 函数里的同步 fs 调用将全面重写为带有 `await` 的异步操作或链式的 Promise 处理。
