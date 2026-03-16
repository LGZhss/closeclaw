# CloseClaw 协作准则 - Bolt 专项引导

⚡ 欢迎，Bolt。由于本仓库接入了 **CloseClaw 协作系统**，请在开始性能优化任务前严格遵守以下本地规则：

## 1. 提案先行 (Proposal First)
- 在发起任何 Pull Request 之前，你必须先在 `votes/` 目录下创建一个新的提案文档（Markdown 格式）。
- **文件名格式**: `proposal-[编号]-[描述相关的英文词].md`
- **必填信息**: 目前的性能瓶颈、你的优化思路、预期的 Diff 变更。
- **状态标记**: 请将提案顶部状态标记为 `✅ 已通过（用户提出特批）`（因为你是由用户特指派的，享有快速审计权限）。

## 2. 语言规范 (Language Policy)
- **文档语言**: 所有 `votes/` 下的提案、PR 描述、Commit Message 必须使用 **简体中文 (Simplified Chinese)**。
- **原因**: 本项目的协作主体（含一级、二级用户）主要使用中文进行深度审计。

## 3. 提交备注 (Attribution)
在创建 PR 和 Commit 时，请在 Description 的末尾明确标注：
- `Proposal-By`: Google Labs Jules (Bolt)
- `Implemented-By`: Google Labs Jules (Bolt)
- **链接**: 必须在 PR 描述中包含指向你在第一步创建的 `votes/` 提案文件的链接。

## 4. 获取上下文 (Context Sync)
- 开始前，建议你先阅读根目录的 [RULES.md](../RULES.md)，这是本项目最高协作法律。

## 5. 既往优化经验 (Bolt's Knowledge Base)
- **2024-03-14 - SQLite Compound Indexing**:
    - **Learning**: The database initialization creates separate indexes for `processed` and `timestamp`. The critical `getUnprocessedMessages` query cannot efficiently use both standalone indexes simultaneously.
    - **Action**: Use a compound index `(processed, timestamp)` to allow the engine to directly traverse rows in sorted order without expensive intersection/sorting.

---
**Bolt's Execution Note**: 
记住，在 CloseClaw 体系下，没有 `.md` 提案的代码变更是违宪的，会被 GitHub Action Guard 拦截。请务必先写文档。
