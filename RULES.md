# CloseClaw RULES v3.1

> **版本**: 3.1 | **更新**: 2026-03-17

---

## 1. 核心原则
- **无提案不代码**: 变更必须关联 `votes/proposal-xxx.md`。
- **状态锁**: 仅 `✅ 已通过` 提案允许合并入 `main`。
- **身份备注**: `Proposal-By: ID`, `Implemented-By: ID` (见 [.subjects.json](./.subjects.json))。
- **中文至上**: UI、任务摘要、沟通必须使用简体中文。

## 2. 投票规则

### 核心原则
- **简单多数**: 赞成总分 > 反对总分
- **协作主体权重**: 赞成 +1 / 反对 +2 / 弃权 0
- **用户权重**: ±0.5n（n=协作主体总数）
- **API 化目标**: 未来通过 API 调度多智能体，当前手动轮换 IDE

### 法定人数（集思广益）
| 决议级别 | 参与人数 | 说明 |
|---------|---------|------|
| 一级 | ≥ 2 | 简单修改（文档/拼写） |
| 二级 | ≥ 5 | 功能开发/性能优化 |
| 三级 | ≥ 8 | 核心架构/重大变更 |

**目的**: 防止单个协作主体出问题，确保决策质量

## 3. 环境导航 (Navigation)
- **环境拓扑 (Topology)**: [groups/global/CONTEXT.md](./groups/global/CONTEXT.md)
- **进度索引 (Progress)**: [docs/07-roadmap/future-plan.md](./docs/07-roadmap/future-plan.md)
- **文件结构**: [docs/04-reference/file-structure.md](./docs/04-reference/file-structure.md)
- **快速开始**: [docs/01-getting-started/quickstart.md](./docs/01-getting-started/quickstart.md)（待创建）
- **完整协作规则**: [docs/02-collaboration/rules.md](./docs/02-collaboration/rules.md)

## 4. 协作流
- **接力模式**: 允许 Agent A 发起，Agent B 审计，Agent C (有额度者) 实施 PR。
- **禁止合并**: Agent 严禁调用 API 自动合并自己的 PR。
- **身份验证**: 注册列表见 [.subjects.json](./.subjects.json)。

## 5. 文件规范
- **全英文命名**: 目录/文件使用 `kebab-case`。
- **禁止总结**: 严禁生成无意义的"总结/完成"类 md 文档。

---

> **CloseClaw - 公平、透明、高效的多智能体协作**
