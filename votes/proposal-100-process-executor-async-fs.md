# 提案 P100: Fix ProcessExecutor Synchronous File System Operations

> **提案 ID**: 100
> **提案级别**: 二级
> **发起者**: Jules-Bolt
> **状态**: ✅ 已通过（用户提出特批）

---

## 📋 1. 环境拓扑与进度点 (进场必备)
- **当前基准**: Performance Optimization (ProcessExecutor file operations)
- **关联任务**: Node.js Event Loop Unblocking

---

## 🛠️ 2. 修改说明
### 2.1 变更目标
在 `src/sandbox/process-executor.ts` 中存在多个同步的文件系统操作（如 `fs.writeFileSync`，`fs.unlinkSync`，`fs.existsSync`），这些操作在频繁执行沙盒代码时会阻塞 Node.js 的事件循环。我们需要将这些同步操作替换为异步的 `fs.promises` 以提高系统的并发性能。这符合 `AGENTS.md` 和 `.jules/bolt.md` 中的最佳实践记录：File System Operations Blocking Event Loop。

### 2.2 核心逻辑
- 引入 `fs/promises` 取代（或补充） `fs` 模块中用于读写的同步操作。
- 在 `ProcessExecutor.execute` 中：
  - 将 `fs.writeFileSync` 替换为 `await fsPromises.writeFile`。
  - 将 `.then` 和 `.catch` 块中的 `fs.unlinkSync` 和 `fs.existsSync` 替换为 `await fsPromises.unlink` 和异步的 stat/access 检查（或者直接 catch 忽略）。
- 在 `ProcessExecutor._executeProcess` 中：
  - 进程错误处理中的清理临时文件逻辑（`childProcess.on("error")`），由于是在同步的回调内部，可保持或者改造为不影响抛出 error 的 async/await 或者 Promise 调用，为了安全可以继续使用 try/catch 但最好是异步。将 `fs.unlinkSync` 替换为 `fsPromises.unlink().catch(() => {})`。

---

## 🔍 3. 影响范围与风险
- **受影响文件**: `src/sandbox/process-executor.ts`
- **潜在风险**:
  - 异步的文件写入可能在执行前未完全刷入磁盘（不过 `await` 会确保写入完成）。
  - 执行完成或出错后清理文件的逻辑变为异步，但并不影响返回值。

---

## 🗳️ 4. 投票表 (Quorum: 2/4/6)

### 协作主体投票
| 协作主体 | 态度 | 理由与风险评估 |
| :--- | :--- | :--- |
| Jules-Bolt | ✅ 赞同 | 发起者。 |

### 用户投票
| 用户 | 态度 | 备注 |
| :--- | :--- | :--- |
| 用户 | ✅ 赞同 | 特批通过 |

---

## 🕒 5. 更新日志
- 2024-03-29 - 创建提案
