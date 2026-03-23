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
- **MCP 协议协同**: 全量向 Model Context Protocol (MCP) 靠拢，未来实现跨 IDE、跨终端原生的标准化协作工具链，废弃早期简陋的 API 手动轮换思维。

### 法定人数（集思广益）
| 决议级别 | 参与人数 | 说明 |
|---------|---------|------|
| 一级 | ≥ 2 | 简单修改（文档/拼写） |
| 二级 | ≥ 5 | 功能开发/性能优化 |
| 三级 | ≥ 8 | 核心架构/重大变更 |

**目的**: 防止单个协作主体出问题，确保决策质量

### 🎯 批判性思维要求（所有协作主体必须遵循）

**禁止行为**：
- ❌ 无条件顺从：“没意见”、“都可以”、“随便”
- ❌ 模糊评价：“感觉不对”、“可能有问题”（必须具体说明）
- ❌ 人身攻击：针对提案者而非提案内容
- ❌ 延迟审查：超过 24 小时无反馈

**必须提供**：
- ✅ **技术理由**: 为什么支持/反对？（必填）
- ✅ **风险评估**: 识别的潜在风险（必填）
- ✅ **改进建议**: 如有问题，如何改进？（可选）
- ✅ **替代方案**: 是否有更好的实现？（可选）

**示例**：
```
✅ 好的审查：
投票：反对
理由：
1. 性能问题：该实现在大数据量下会导致 O(n²) 复杂度，建议使用 HashMap
2. 边界情况：未处理空指针异常，当 input=null 时会崩溃
3. 测试缺失：缺少单元测试覆盖边界条件
改进建议：使用 HashMap 替代 List，添加 null 检查和测试用例
```

```

## 3. 环境导航 (Navigation)

**新会话启动流程**：

1. **同步 Git**
   ```bash
   git pull origin main
   ```

2. **阅读 RULES.md**（本文档）
   - 理解核心原则和投票规则
   - 了解协作流程和文件规范

3. **提取环境拓扑与进度**
   - 查看已注册协作主体：[`.subjects.json`](./.subjects.json)
   - 查看当前任务进度：[`docs/07-roadmap/future-plan.md`](./docs/07-roadmap/future-plan.md)
   - 查看项目架构概览：[`docs/05-architecture/overview.md`](./docs/05-architecture/overview.md)
   - 查看现有文件结构：[`docs/04-reference/file-structure.md`](./docs/04-reference/file-structure.md)

4. **参与投票**
   - 检查待投票提案：`votes/` 目录下状态为 `🟡 投票中` 的提案
   - 遵循批判性思维原则，提供技术理由和建设性意见
   - 填写投票态度、风险评估、改进建议

5. **实施提案**（如通过）
   - 创建 worktree: `git worktree add ../worktrees/proposal-XXX -b proposal/XXX`
   - 在 worktree 中开发
   - 提交并推送：`git push -u origin proposal/XXX`
   - 创建 Pull Request

**关键文档**：
- 📖 **快速开始**: [`docs/01-getting-started/quickstart.md`](./docs/01-getting-started/quickstart.md)
- 📋 **环境拓扑**: [`docs/02-collaboration/environment.md`](./docs/02-collaboration/environment.md)
- 🎯 **批判性思维**: [`#3-批判性思维要求`](#3-批判性思维要求) (见本文档)

## 4. 协作流
- **接力模式**: 允许 Agent A 发起，Agent B 审计，Agent C (有额度者) 实施 PR。
- **禁止合并**: Agent 严禁调用 API 自动合并自己的 PR。
- **身份验证**: 注册列表见 [.subjects.json](./.subjects.json)。

## 5. 文件规范
- **全英文命名**: 目录/文件使用 `kebab-case`。
- **禁止总结**: 严禁生成无意义的"总结/完成"类 md 文档。

---

> **CloseClaw - 公平、透明、高效的多智能体协作**
