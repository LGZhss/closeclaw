# CloseClaw RULES v3.1

> **版本**: 3.1 | **更新**: 2026-03-17

---

## 1. 核心原则
- **无提案不代码**: 变更必须关联 `votes/proposal-xxx.md`。
- **状态锁**: 仅 `✅ 已通过` 提案允许并入 `main`。
- **身份备注**: `Proposal-By: ID`, `Implemented-By: ID` (见 [.subjects.json](./.subjects.json))。
- **中文至上**: UI、任务摘要、沟通必须使用简体中文。

## 2. 投票规则（详细规则见 [docs/02-collaboration/rules.md](./docs/02-collaboration/rules.md)）

### 得分计算
- **协作主体**: 赞同 +1，反对 -1，弃权 0
- **用户**: 
  - 赞同：用户得分 = 协作主体总数 / 2，反对得分 = 0
  - 反对：用户得分 = 0，反对得分 = 协作主体总数 / 2
  - 弃权：用户得分 = 0，反对得分 = 0
- **通过条件**: 赞同得分 > 反对得分

### 法定人数
| 决议级别 | 协作主体参与人数 |
|---------|---------------|
| 一级 | ≥ 2 |
| 二级 | ≥ 3 |
| 三级 | ≥ 5 |

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
