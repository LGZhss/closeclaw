# CloseClaw RULES v3.1

> **版本**: 3.1 | **更新**: 2026-03-17

---

## 1. 核心原则
- **无提案不代码**: 变更必须关联 `votes/proposal-xxx.md`。
- **状态锁**: 仅 `✅ 已通过` 提案允许合并入 `main`。
- **身份备注**: `Proposal-By: ID`, `Implemented-By: ID` (见 [.subjects.json](./.subjects.json))。
- **中文至上**: UI、任务摘要、沟通必须使用简体中文。

## 2. 投票规则（详细规则见 [docs/02-collaboration/rules.md](./docs/02-collaboration/rules.md)）

### 一、角色分值设定
| 角色 | 赞成 | 反对 | 弃权 |
|------|------|------|------|
| **协作主体**（~30人） | +1 分 | +2 分 | 0 分 |
| **用户**（1人） | +0.5n 分（到赞成方） | +0.5n 分（到反对方） | 0 分 |

其中，`n` = 协作主体总人数

### 二、判定公式
决议通过的唯一条件为：

```
赞成总分 > 反对总分
```

展开：
```
(协作主体赞成 × 1 + 用户赞成) > (协作主体反对 × 2 + 用户反对)
```

### 三、示例
**场景**：5 个协作主体赞同，2 个协作主体反对，用户赞同

**计算**：
- 协作主体总人数 n = 7
- 协作主体赞成 = 5 × 1 = 5
- 协作主体反对 = 2 × 2 = 4
- 用户赞成 = 0.5 × 7 = 3.5
- 用户反对 = 0
- 赞成总分 = 5 + 3.5 = 8.5
- 反对总分 = 4 + 0 = 4
- **8.5 > 4** → ✅ 通过

### 四、法定人数
| 决议级别 | 协作主体参与人数 |
|---------|---------------|
| 一级 | ≥ 2 |
| 二级 | ≥ 5 |
| 三级 | ≥ 8 |

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
