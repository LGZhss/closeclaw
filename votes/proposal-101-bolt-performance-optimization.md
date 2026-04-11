# 提案 P101: Bolt 性能优化 - 移除阻塞事件循环的同步文件系统操作

> **提案 ID**: 101
> **提案级别**: 二级
> **发起者**: Bolt
> **状态**: ✅ 已通过（用户特批）

---

## 📋 1. 环境拓扑与进度点

- **当前基准**: Performance Optimization
- **关联任务**: Node.js Event Loop Unblocking

---

## 🛠️ 2. 修改说明

### 2.1 变更目标

在 `src/utils/utils.ts` 和 `src/sandbox/process-executor.ts` 中存在多个使用 `fs.existsSync()` 的同步文件系统操作。尽管其单次执行速度较快，但在并发量较高时会阻塞 Node.js 事件循环。为优化性能并符合基线架构，需要移除 `fs.existsSync()` 的调用，依靠原生的异步错误处理（例如捕获 `ENOENT`）和原生选项（例如 `mkdir` 的 `recursive: true`）。

### 2.2 核心逻辑

- `src/utils/utils.ts`:
  - `ensureDirAsync`: 移除 `fs.existsSync(dirPath)`，直接调用 `await fsPromises.mkdir(dirPath, { recursive: true })` 并忽略 `EEXIST` 错误。
  - `readWsFileAsync`: 移除 `fs.existsSync(safePath)`，直接调用 `await fsPromises.readFile` 并在 `ENOENT` 错误时抛出自定义的错误信息。
- `src/sandbox/process-executor.ts`:
  - `ProcessExecutor.execute` (finally): 移除 `fs.existsSync(tempFile)`，直接执行 `await fsPromises.unlink` 并忽略 `ENOENT`。
  - `ProcessExecutor._executeProcess` (childProcess.on("error")): 移除 `fs.existsSync(tempPath)`，直接执行 `fsPromises.unlink` 并忽略 `ENOENT`。

---

## 🔍 3. 影响范围与风险

- **受影响文件**: `src/utils/utils.ts` 和 `src/sandbox/process-executor.ts`
- **潜在风险**: 移除文件检查可能会导致一些由于竞态条件触发的不一致性，但依赖底层的异步错误捕获更能反映真实情况，减少了“检查和使用之间的时间差”问题。

---

## 🗳️ 4. 投票表 (Quorum: 2/4/6)

### 协作主体投票

| 协作主体 | 态度    | 理由与风险评估 |
| :------- | :------ | :------------- |
| Bolt     | ✅ 赞同 | 发起者。       |

### 用户投票

| 用户 | 态度    | 备注     |
| :--- | :------ | :------- |
| 用户 | ✅ 赞同 | 特批通过 |

---

## 🕒 5. 更新日志

- 2026-04-11 - 创建提案
