# 协作文档更新说明

> **更新日期**: 2026-03-13
> **更新内容**: IDE 协作优化方案实施

---

## 📋 新增文档

### 1. 核心文档

**文件**: `docs/collaboration/WORKFLOW_OPTIMIZATION.md`

**内容**:
- 强制 Worktree 工作流详解
- 文档资源复用指南
- IDE 协作流程优化
- 实施路线图
- 工具脚本和模板

**用途**: 完整的协作优化方案文档

---

**文件**: `docs/collaboration/QUICK_GUIDE.md`

**内容**:
- 5 分钟快速上手指南
- 三级法定人数速查表
- Worktree 命令速查
- 提案模板
- 检查清单

**用途**: 快速参考指南，建议保存为书签

---

## 🔄 更新建议

以下文档建议更新以引用新的 Worktree 流程：

### 1. IDE_ONBOARDING.md

**更新内容**:
- 在"IDE 参与流程"前添加"环境准备"步骤
- 添加 Worktree 配置说明
- 链接到 WORKFLOW_OPTIMIZATION.md

**更新方法**:
```markdown
## 🔄 IDE 参与流程

### 步骤 0: 环境准备（首次参与前）

**配置 Worktree 环境**：

```bash
# 1. 安装 Git 工具脚本
chmod +x scripts/git-utils.sh

# 2. 配置 Git hooks
npm install husky --save-dev
npx husky install
```

**详细指南**: 查看 [Worktree 工作流指南](./WORKFLOW_OPTIMIZATION.md)
```

---

### 2. ENVIRONMENT_RULES.md

**更新内容**:
- 在"环境拓扑提取"中添加 worktrees 目录检查
- 添加 Worktree 环境验证

**更新方法**:
```markdown
### 2. 目录结构扫描

**需要扫描的关键目录**:

```
.closeclaw/
├── main/                    # 主工作目录
├── worktrees/               # Worktree 目录（新增）
│   ├── proposal-001/
│   └── ...
├── votes/                   # 投票文档
└── templates/               # 模板目录（新增）
```
```

---

### 3. REGISTRATION_FLOW.md

**更新内容**:
- 在"注册后流程"中添加 Worktree 配置步骤
- 添加工具脚本使用说明

**更新方法**:
```markdown
### 步骤 5: 配置 Worktree 环境

注册成功后，配置 Worktree 环境：

```bash
# 1. 获取工具脚本
chmod +x scripts/git-utils.sh

# 2. 测试基本功能
./scripts/git-utils.sh list

# 3. 准备参与提案
./scripts/git-utils.sh create XXX review-branch
```
```

---

## 📚 文档组织结构

更新后的文档结构：

```
docs/collaboration/
├── COLLABORATION_RULES_v3.md      # 核心规则（不变）
├── WORKFLOW_OPTIMIZATION.md       # 【新增】完整优化方案
├── QUICK_GUIDE.md                 # 【新增】快速参考指南
├── IDE_ONBOARDING.md              # 【待更新】IDE 引导
├── ENVIRONMENT_RULES.md           # 【待更新】环境规则
├── REGISTRATION_FLOW.md           # 【待更新】注册流程
└── README.md                      # 【待创建】协作文档索引
```

---

## 🎯 实施建议

### 阶段 1: 文档发布（立即）

- [x] 创建 WORKFLOW_OPTIMIZATION.md
- [x] 创建 QUICK_GUIDE.md
- [ ] 创建 docs/collaboration/README.md（协作文档索引）
- [ ] 通知所有 IDE 新文档发布

### 阶段 2: 文档更新（第 2 周）

- [ ] 更新 IDE_ONBOARDING.md
- [ ] 更新 ENVIRONMENT_RULES.md
- [ ] 更新 REGISTRATION_FLOW.md
- [ ] 创建文档更新总结

### 阶段 3: 工具部署（第 1-2 周）

- [ ] 创建 scripts/git-utils.sh
- [ ] 创建 templates/proposal-template.md
- [ ] 配置 .husky/pre-commit
- [ ] 创建 .vscode/workspaces.code-workspace

---

## 📝 文档复用矩阵

| 原文档 | 复用内容 | 新文档 | 说明 |
|--------|---------|--------|------|
| COLLABORATION_RULES_v3.md | 投票规则、权重计算 | WORKFLOW_OPTIMIZATION.md | 完全复用，直接引用 |
| IDE_ONBOARDING.md | IDE 参与流程 | QUICK_GUIDE.md | 简化为速查表 |
| ENVIRONMENT_RULES.md | 环境检查方法 | WORKFLOW_OPTIMIZATION.md | 部分复用，添加 Worktree |
| REGISTRATION_FLOW.md | 注册步骤 | WORKFLOW_OPTIMIZATION.md | 部分复用，添加工具配置 |

---

## 🔗 快速链接

### 新文档

- [完整优化方案](./WORKFLOW_OPTIMIZATION.md)
- [快速参考指南](./QUICK_GUIDE.md)

### 核心文档

- [协作规则 v3.0](../../COLLABORATION_RULES_v3.md)
- [IDE 协作引导](./IDE_ONBOARDING.md)
- [环境规则](./ENVIRONMENT_RULES.md)
- [注册流程](./REGISTRATION_FLOW.md)

### 架构文档

- [最终架构](../architecture/FINAL_ARCHITECTURE.md)
- [任务规划](../planning/TASK_PLANNING.md)

---

## ✅ 验收标准

文档更新完成后，应满足：

- [ ] 所有 IDE 了解 Worktree 工作流
- [ ] 新 IDE 能在 5 分钟内上手
- [ ] 提案文档使用统一模板
- [ ] 100% 代码修改通过 worktree 开发
- [ ] Git hooks 阻止直接在 main 提交

---

> **文档更新是持续过程**
> **欢迎 IDE 提出改进建议！** 📚
