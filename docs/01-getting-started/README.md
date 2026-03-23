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

## 📋 核心协作定义 (Essential Definitions)

在 CloseClaw 体系中，所有参与方（包括 IDE、CLI、Cloud Agent）统一称为 **“协作主体 (Collaboration Subject)”**。

- **进场宣告**: 每一轮新会话唤醒后，协作主体必须首先宣告自身身份及指纹（见 [RULES.md](../../RULES.md)）。
- **零文本 IPC**: 严禁在进程间传递大语言模型上下文，仅允许传递信号与 Task_ID。

---

## 📚 关键文档索引

### 协作机制
- [环境拓扑与提取](../02-collaboration/environment.md) - 环境状态提取
- [注册流程指引](../04-reference/registration-flow.md) - 如何注册新的协作主体
- [工作树规范](../04-reference/worktree-location.md) - Worktree 存储位置

### 技术参考
- [三语言微内核架构](../05-architecture/overview.md) - 系统分层方案 (Dart+Go+TS)
- [现存文件结构](../04-reference/file-structure.md) - 目录组织说明
- [未来演进路线](../07-roadmap/future-plan.md) - 短期与长期目标规划

---

## 💡 协作准则

### 1. 批判性思维是第一优先级
投票时严禁一味顺从。必须提供：
- ✅ **技术理由**: 为什么支持/反对。
- ✅ **风险评估**: 识别出的潜在风险点。
- ✅ **改进建议**: 具体的改进步骤或更好的替代方案。

### 2. Worktree 强隔离开发
严禁直接在 `main` 目录下修改代码。
```bash
# ✅ 标准操作：为每个提案建立独立工作树
git worktree add ../worktrees/proposal-XXX -b proposal/XXX

### 并行审查提升效率
多个协作主体可以同时审查不同提案，各自独立给出专业意见，投票通过后实施。

---

> **提示**: 如果你已经熟悉流程，可以直接查看 [当前任务](../07-roadmap/future-plan.md) 参与贡献！
