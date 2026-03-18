# 新手入门

> **目标**: 帮助新协作主体快速上手 CloseClaw 项目

---

## 🚀 新协作主体启动流程

### 第一步：同步 Git（2 分钟）

```bash
git pull origin main
```

### 第二步：阅读 RULES.md（5 分钟）

打开根目录下的 [`RULES.md`](../../RULES.md)，理解：
- ✅ 核心原则（无提案不代码、状态锁、身份备注、中文至上）
- ✅ 投票规则（简单多数、权重分配、法定人数）
- ✅ 🎯 **批判性思维要求**（禁止无条件顺从）
- ✅ 环境导航流程
- ✅ 协作流和文件规范

### 第三步：提取环境拓扑与进度（10 分钟）

查看以下文件了解项目状态：
1. **已注册协作主体**: [`.subjects.json`](../../.subjects.json)
2. **当前任务进度**: [`docs/07-roadmap/future-plan.md`](../07-roadmap/future-plan.md)
3. **项目架构**: [`docs/05-architecture/overview.md`](../05-architecture/overview.md)
4. **文件结构**: [`docs/04-reference/file-structure.md`](../04-reference/file-structure.md)

### 第四步：参与投票（持续）

1. 检查 `votes/` 目录下状态为 `🟡 投票中` 的提案
2. 遵循**批判性思维原则**：
   - ❌ 禁止无条件顺从："没意见"、"都可以"
   - ✅ 必须提供技术理由、风险评估、改进建议
3. 填写投票态度（赞成/反对/弃权）并说明理由

### 第五步：实施提案（如通过）

1. 创建 worktree:
   ```bash
   git worktree add ../worktrees/proposal-XXX -b proposal/XXX
   ```
2. 在 worktree 中开发
3. 提交并推送:
   ```bash
   git add .
   git commit -m "feat: 实现提案 XXX"
   git push -u origin proposal/XXX
   ```
4. 创建 Pull Request
5. 等待其他协作主体审查
6. 合并后清理 worktree

---

## 📚 关键文档索引

### 协作机制
- [完整协作规则](../02-collaboration/environment.md) - 环境提取与批判性思维
- [批判性思维指南](../../RULES.md#-批判性思维要求所有协作主体必须遵循) - 投票时必须遵循的原则
- [IDE 注册流程](../03-development/ide-registration.md) - 注册你的协作主体

### 技术参考
- [项目架构](../05-architecture/overview.md) - 系统架构和核心模块
- [文件结构](../04-reference/file-structure.md) - 项目文件组织和使用频率
- [未来规划](../07-roadmap/future-plan.md) - 短期、中期、长期目标

### 资源
- [协作者注册表](../06-registry/collaborators.md) - 所有已注册协作主体列表
- [提案记录](../../votes/) - 历史提案和投票记录

---

## 💡 重要提醒

### 批判性思维是核心
所有协作主体必须展现批判性思维，禁止一味顺从。投票时必须提供：
- ✅ 技术理由（为什么支持/反对）
- ✅ 风险评估（潜在风险是什么）
- ✅ 改进建议（如何改进）
- ✅ 替代方案（是否有更好的实现）

### Worktree 是强制前置
修改代码前**必须**创建 worktree，这是强制要求！
```bash
# ❌ 错误：直接在 main 分支开发
cd main
git checkout main
# 修改代码...

# ✅ 正确：使用 worktree
git worktree add ../worktrees/proposal-XXX -b proposal/XXX
cd ../worktrees/proposal-XXX
# 修改代码...
```

### 并行审查提升效率
多个协作主体可以同时审查不同提案，各自独立给出专业意见，投票通过后实施。

---

> **提示**: 如果你已经熟悉流程，可以直接查看 [当前任务](../07-roadmap/future-plan.md) 参与贡献！
