# CloseClaw RULES v2.2 [BALANCED]

## 1. 核心原则
- **无提案不代码**: 变更必须关联 `votes/proposal-xxx.md`。
- **状态锁**: 仅 `✅ 已通过` 提案允许并入 `main`。
- **身份备注**: `Proposal-By: ID`, `Implemented-By: ID` (见 `.subjects.json`)。
- **中文至上**: UI、任务摘要、沟通必须使用简体中文。

## 2. 环境导航 (Navigation)
- **环境拓扑 (Topology)**: [groups/global/CONTEXT.md](./groups/global/CONTEXT.md) (核心架构与依赖)
- **进度索引 (Progress)**: [docs/roadmap/NEXT_STEPS.md](./docs/roadmap/NEXT_STEPS.md) | [task.md](file:///C:/Users/lgzhs/.gemini/antigravity/brain/e15a647a-fa9d-4ec2-900a-f80cfc93fd18/task.md)
- **文件结构**: [docs/reference/FILE_STRUCTURE.md](./docs/reference/FILE_STRUCTURE.md)

## 3. 协作流
- **接力模式**: 允许 Agent A 发起，Agent B 审计，Agent C (有额度者) 实施 PR。
- **禁止合并**: Agent 严禁调用 API 自动合并自己的 PR。
- **身份验证**: 注册列表见根目录 [.subjects.json](./.subjects.json)。

## 4. 文件规范
- **全英文命名**: 目录/文件使用 `kebab-case`。
- **禁止总结**: 严禁生成无意义的“总结/完成”类 md 文档。

---
> **版本**: 2.2 | **更新**: 2026-03-14
