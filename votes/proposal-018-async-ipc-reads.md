# 代码修改提案：将 IPC 读写优化为异步操作以防止阻塞事件循环

> **提案 ID**: 018
> **提案级别**: 二级决议
> **发起者**: @Google Labs Jules (Bolt)
> **发起日期**: 2026-03-16
> **状态**: ✅ 已通过（用户提出特批）
> **Worktree 分支**: `proposal/018-async-ipc-reads`

---

## 📋 提案说明

### 背景
目前在 `src/ipc.ts` 中，`getPendingMessages` 和 `cleanupIPC` 等操作使用了同步的文件系统操作（如 `fs.readFileSync`, `fs.readdirSync`, `fs.statSync`, `fs.unlinkSync`）。由于这些操作在热路径上或定时任务中执行，当存在大量 IPC 消息或任务文件时，顺序执行同步文件读取将严重阻塞 Node.js 事件循环，导致整体应用性能下降和延迟增加。

### 目标
消除 IPC 通信层中不必要的同步文件操作，确保所有针对消息或任务的处理不会长时间占用主线程。

### 实现方案
1. 将 `getPendingMessages` 和 `cleanupIPC` 重构为 `async` 函数。
2. 使用 `fs.promises` 中的 `readdir`, `readFile`, `stat` 和 `unlink`。
3. 结合 `Promise.all` 机制，并发处理多个文件的读取和清理。
4. 修改调用方（如 `pollIPC`），在调用异步函数时加上 `await`。

### 影响范围
- `src/ipc.ts`：修改 `getPendingMessages`, `cleanupIPC`, `pollIPC` 的实现。
- 由于仅在内部改变实现方式，且保证 Promise 解析后的数据结构一致，因此整体架构安全。

### 风险评估
- **风险**: 修改同步为异步后，如果存在调用方依赖同步返回值，则会中断逻辑。
- **缓解**: 当前 `getPendingMessages` 仅在 `pollIPC` (本身即为 async) 内调用，并且在重构时会在所有调用方同步加上 `await`。针对 `cleanupIPC` 的重构，调用方可以安全地进行 `await` 或不阻塞等待清理完成。

---

## 🔗 源码参考

- **修改文件列表**:
  - [x] `src/ipc.ts` - 替换 `fs` 同步 API 为 `fs.promises`。

---

## 🗳️ 投票表

### IDE 投票

| IDE | 态度 | 得分 | 备注 |
|-----|------|------|------|
| Google Labs Jules (Bolt) | ✅ 赞同 | 1 | |

**统计**:
- 参与数：1
- 赞同数：1
- 反对数：0
- 弃权数：0

---

## 📊 最终统计

| 项目 | 值 |
|------|-----|
| **通过状态** | ✅ 已通过（用户提出特批） |

---

## 📝 更新日志

- 2026-03-16 - 创建提案
