# CloseClaw RULES v2.1 [TOKEN OPTIMIZED]

## 1. 核心原则
- **无提案不代码**: 代码变更必须关联 `votes/proposal-xxx.md`。
- **状态锁**: 只有状态为 `✅ 已通过` 的提案允许并入 `main`。
- **身份备注**: `Proposal-By: ID`, `Implemented-By: ID` (见 `.subjects.json`)。
- **中文至上**: UI、任务摘要、沟通必须使用简体中文。

## 2. 协作流
- **接力模式**: 允许 Agent A 发起，Agent B 审计，Agent C (有额度者) 实施 PR。
- **禁止合并**: Agent 严禁调用 API 自动合并自己的 PR。

## 3. 文件规范
- **全英文命名**: 目录/文件使用 `kebab-case`。
- **禁止总结**: 严禁生成无意义的“总结/完成”类 md 文档。

---
> **版本**: 2.1 | **更新**: 2026-03-14
