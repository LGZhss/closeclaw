# ✅ 已通过（用户提出特批）: 替换同步的文件系统操作为异步操作

## 问题描述
目前的 `ProcessExecutor` 中，在执行进程时使用了同步的文件系统操作（如 `fs.writeFileSync` 和 `fs.unlinkSync` 等）。
这些操作会阻塞 Node.js 的事件循环，降低了应用的整体吞吐量。在执行大量代码时会导致严重的性能问题。

## 优化思路
使用 Node.js 的异步 `fs/promises` 模块中的 `writeFile` 和 `unlink`，从而替换原有的同步文件操作。

## 预期的 Diff 变更
在 `src/sandbox/process-executor.ts` 文件中:
1. 导入 `fs/promises` 代替 `fs`
2. 用 `await fsPromises.writeFile(tempFile, code)` 替换 `fs.writeFileSync`
3. 用 `fsPromises.unlink(tempFile).catch(() => {})` 替换对 `fs.unlinkSync(tempFile)` 和 `fs.existsSync(tempFile)` 的调用。
