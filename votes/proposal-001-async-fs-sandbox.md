# ✅ 已通过（用户提出特批）

## 提案人
@Jules-Bolt

## 目标
优化 `src/sandbox/process-executor.ts` 中的文件系统操作，将同步操作（如 `fs.writeFileSync`、`fs.unlinkSync`、`fs.existsSync`）替换为基于 Promise 的异步操作（如 `fs.promises.writeFile`、`fs.promises.unlink`）。

## 目前的性能瓶颈
在进程执行器中频繁进行同步文件读写操作（在 `execute` 方法中写临时文件、执行完毕后清理临时文件），会阻塞 Node.js 事件循环。在处理大量并发进程时，会严重降低系统的吞吐量和响应速度。

## 优化思路
使用 Node.js 的 `fs.promises` API 重构 `execute` 方法。将原有的基于 `new Promise` 构造器包裹同步代码的模式，改为完整的 `async/await` 异步控制流。同时在 `_executeProcess` 的错误处理逻辑中，将同步的文件清理改为触发不抛出异常的异步清理操作。

## 预期的 Diff 变更
- `src/sandbox/process-executor.ts` 中的 `fs.writeFileSync` 替换为 `await fs.promises.writeFile`。
- `fs.unlinkSync` 替换为 `await fs.promises.unlink`（并在错误时忽略异常）。
- 移除 `fs.existsSync` 检查，改为直接尝试 `unlink` 并在抛出 `ENOENT` 时捕获异常。
- `_executeProcess` 进程报错时的垃圾回收代码改为异步执行 `fs.promises.unlink(tempPath).catch(() => {})`。