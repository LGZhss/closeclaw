# 提案 P101: Fix Tool Registry Synchronous File System Operations

> **提案 ID**: 101
> **提案级别**: 二级
> **发起者**: Jules-Bolt
> **状态**: ✅ 已通过（用户提出特批）

---

## 📋 1. 环境拓扑与进度点 (进场必备)

- **当前基准**: Performance Optimization (Tool Registry file operations)
- **关联任务**: Node.js Event Loop Unblocking

---

## 🛠️ 2. 修改说明

### 2.1 变更目标

在 `src/tools/tool-registry.ts` 中存在同步的文件系统操作（`readWsFile`，`writeWsFile`），这些操作在频繁执行工具时会阻塞 Node.js 的事件循环。我们需要将这些同步操作替换为异步的 `readWsFileAsync` 和 `writeWsFileAsync` 以提高系统的并发性能。

### 2.2 核心逻辑

- 在 `src/tools/tool-registry.ts` 中：
  - 将 `import { readWsFile, writeWsFile } from "../utils/utils.js";` 替换为 `import { readWsFileAsync, writeWsFileAsync } from "../utils/utils.js";`。
  - 将 `read_file` 的处理逻辑修改为使用 `await readWsFileAsync`。
  - 将 `write_file` 的处理逻辑修改为使用 `await writeWsFileAsync`。

---

## 🔍 3. 影响范围与风险

- **受影响文件**: `src/tools/tool-registry.ts` 和关联的 exploration 测试文件。
- **潜在风险**: 极低，完全遵循原有的异步工具设计接口。

---

## 🗳️ 4. 投票表 (Quorum: 2/4/6)

### 协作主体投票

| 协作主体   | 态度    | 理由与风险评估 |
| :--------- | :------ | :------------- |
| Jules-Bolt | ✅ 赞同 | 发起者。       |

### 用户投票

| 用户 | 态度    | 备注     |
| :--- | :------ | :------- |
| 用户 | ✅ 赞同 | 特批通过 |
