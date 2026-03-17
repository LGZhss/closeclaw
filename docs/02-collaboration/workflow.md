# CloseClaw IDE 协作优化方案

> **版本**: 1.0.0
> **创建日期**: 2026-03-13
> **状态**: 🟢 生效中
> **目标**: 系统性优化 IDE 协作机制，提升开发效率与协作规范性

---

## 📋 目录

1. [执行摘要](#执行摘要)
2. [现有架构评估](#现有架构评估)
3. [强制 Worktree 工作流](#强制-worktree-工作流)
4. [文档资源复用指南](#文档资源复用指南)
5. [IDE 协作流程优化](#ide-协作流程优化)
6. [实施路线图](#实施路线图)
7. [附录](#附录)

---

## 执行摘要

### 优化目标

本方案旨在对 CloseClaw 项目的 IDE 协作机制进行系统性优化，重点包括：

1. **实施强制 worktree 工作流** - 确保团队成员遵循统一的分支管理规范
2. **文档资源全面评估** - 识别可复用或修改后可有效使用的文档资源
3. **协作流程优化** - 提供优化后的 IDE 协作流程文档

### 核心原则

- ✅ **保留现有架构稳定性** - 不影响已实现的核心功能
- ✅ **提升开发效率** - 简化协作流程，减少不必要的开销
- ✅ **增强协作规范性** - 建立清晰的工作流程和标准
- ✅ **文档驱动开发** - 充分利用现有文档资源

---

## 现有架构评估

### 项目架构现状

#### 核心架构（基于 NanoClaw + 原沙箱）

```
┌─────────────────────────────────────────────────────────┐
│              编排层 (TypeScript)                         │
│  - index.ts (消息轮询、任务调度)                         │
│  - channels/ (通道自注册)                                │
│  - db.ts (SQLite 存储)                                   │
│  - router.ts (消息格式化)                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              执行层 (JavaScript)                         │
│  - SandboxManager (沙箱管理)                             │
│  - ProcessExecutor (子进程执行)                          │
│  - ToolRegistry (工具注册表)                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              LLM 适配器层 (JavaScript)                    │
│  - ClaudeAdapter (直接 API)                              │
│  - OpenAIAdapter                                         │
│  - GeminiAdapter                                         │
│  - LocalAdapter (Ollama)                                │
└─────────────────────────────────────────────────────────┘
```

#### 协作机制现状

**已有文档资源**：

| 文档 | 路径 | 状态 | 复用建议 |
|------|------|------|---------|
| CLOSECLAW_README.md | 根目录 | ✅ 完整 | 完全复用 - 项目概述 |
| COLLABORATION_RULES_v3.md | 根目录 | ✅ 完整 | 完全复用 - 核心协作规则 |
| DOCUMENTATION_SUMMARY.md | 根目录 | ✅ 完整 | 完全复用 - 文档索引 |
| LEGACY_RESOURCES_SUMMARY.md | 根目录 | ✅ 完整 | 完全复用 - 旧项目资源 |
| MIGRATION_SUMMARY.md | 根目录 | ✅ 完整 | 部分复用 - 迁移总结 |
| README.md | 根目录 | ✅ 完整 | 完全复用 - 用户文档 |
| docs/architecture/FINAL_ARCHITECTURE.md | docs/ | ✅ 完整 | 完全复用 - 架构文档 |
| docs/collaboration/IDE_ONBOARDING.md | docs/ | ✅ 完整 | 完全复用 - IDE 引导 |
| docs/collaboration/ENVIRONMENT_RULES.md | docs/ | ✅ 完整 | 完全复用 - 环境规则 |
| docs/collaboration/REGISTRATION_FLOW.md | docs/ | ✅ 完整 | 完全复用 - 注册流程 |
| docs/planning/TASK_PLANNING.md | docs/ | ✅ 完整 | 部分复用 - 任务规划 |

**评估结论**：

- ✅ **文档完整性**: 95% 的文档已创建且内容完整
- ✅ **架构清晰度**: 6 层架构定义清晰，模块职责明确
- ✅ **协作规则**: 投票机制、法定人数、权重分配都已定义
- ⚠️ **待改进**: 缺少具体的 Git 工作流规范和 IDE 实操指南

---

## 强制 Worktree 工作流

### 概述

实施基于 Git Worktree 的强制分支管理工作流，确保代码修改的规范性和可追溯性。

### Worktree 基础概念

**什么是 Git Worktree？**

Git Worktree 允许你在同一个仓库中拥有多个工作目录，每个工作目录可以独立操作不同的分支。

**为什么使用 Worktree？**

1. ✅ **并行开发** - 同时处理多个提案/功能
2. ✅ **分支隔离** - 每个工作目录对应一个分支
3. ✅ **上下文切换** - 快速在不同任务间切换
4. ✅ **减少错误** - 避免在错误分支上提交代码

---

### Worktree 管理规范

#### 1. 工作目录位置（专门的开发目录）

**标准位置**：`~/dev/closeclaw-proposals/`

```
~/dev/
├── closeclaw/                   # 主项目（main 分支）
│   ├── src/
│   ├── docs/
│   ├── scripts/
│   ├── templates/
│   └── .git/
│
├── closeclaw-proposals/         # 所有提案 worktree（标准位置）
│   ├── proposal-001/            # 提案 001 工作目录
│   ├── proposal-002/            # 提案 002 工作目录
│   ├── feature-auth/            # 功能开发工作目录
│   └── bugfix-login/            # Bug 修复工作目录
│
└── closeclaw-votes/             # 投票文档（可选，与主项目分离）
    ├── proposal-001.md
    ├── proposal-002.md
    └── ...
```

**环境变量**：
```bash
# 可以在 .bashrc 或 .zshrc 中设置自定义位置
export CLOSECLAW_WORKTREES_DIR="$HOME/dev/closeclaw-proposals"

# 或在运行时指定
CLOSECLAW_WORKTREES_DIR="/your/custom/path" ./scripts/git-utils.sh create 001 feature-name
```

**优势**：
- ✅ **集中管理** - 所有提案在一个目录
- ✅ **与主项目分离** - 避免混淆
- ✅ **易于备份** - 可以单独备份提案
- ✅ **权限清晰** - 主项目和提案分离

#### 2. 分支命名规范

| 类型 | 命名格式 | 示例 | 说明 |
|------|---------|------|------|
| 主分支 | `main` | `main` | 稳定版本分支 |
| 开发分支 | `develop` | `develop` | 日常开发分支 |
| 提案分支 | `proposal/{编号}` | `proposal/001` | 投票通过的提案 |
| 功能分支 | `feature/{功能名}` | `feature/voting` | 新功能开发 |
| 修复分支 | `bugfix/{问题名}` | `bugfix/login-error` | Bug 修复 |
| 实验分支 | `experiment/{实验名}` | `experiment/sandbox-v2` | 实验性功能 |

#### 3. Worktree 创建流程

**步骤 1: 投票通过后创建工作树**

```bash
# 进入主工作目录
cd .closeclaw/main

# 创建新的 worktree（基于 main 分支）
git worktree add ../worktrees/proposal-001 -b proposal/001

# 验证 worktree 创建成功
git worktree list
```

**步骤 2: 在 worktree 中开发**

```bash
# 进入 worktree 目录
cd ../worktrees/proposal-001

# 进行代码修改
# ... 编辑文件 ...

# 提交更改
git add .
git commit -m "feat: 实现提案 001 的功能"

# 推送到远程
git push -u origin proposal/001
```

**步骤 3: 开发完成后合并**

```bash
# 返回主工作目录
cd ../../main

# 切换到 develop 分支
git checkout develop

# 合并提案分支
git merge proposal/001

# 清理 worktree（可选）
git worktree remove ../worktrees/proposal-001
```

---

### IDE 协作 Worktree 流程

#### 场景 1: 发起代码修改提案

```mermaid
graph TD
    A[发起提案] --> B[投票通过]
    B --> C[创建 worktree]
    C --> D[在 worktree 中开发]
    D --> E[提交并推送]
    E --> F[发起 Pull Request]
    F --> G[其他 IDE 审查]
    G --> H[合并到 main]
    H --> I[清理 worktree]
```

**详细步骤**：

1. **提案阶段**
   ```bash
   # 在投票文档中创建提案
   # 文件：votes/proposal-XXX.md
   ```

2. **投票通过后**
   ```bash
   # 1. 创建 worktree
   git worktree add ../worktrees/proposal-XXX -b proposal/XXX
   
   # 2. 进入 worktree
   cd ../worktrees/proposal-XXX
   
   # 3. 开始开发
   # ... 编写代码 ...
   ```

3. **开发完成**
   ```bash
   # 1. 提交更改
   git add .
   git commit -m "feat: 实现提案 XXX"
   
   # 2. 推送到远程
   git push -u origin proposal/XXX
   
   # 3. 创建 Pull Request
   # 在 GitHub/GitLab 上创建 PR
   ```

4. **审查与合并**
   ```bash
   # 1. 其他 IDE 审查 PR
   # 2. 审查通过后合并
   git checkout main
   git merge proposal/XXX
   
   # 3. 清理 worktree
   cd ..
   git worktree remove proposal-XXX
   ```

---

#### 场景 2: 参与其他 IDE 的提案审查

```bash
# 1. 创建审查用 worktree
git worktree add ../worktrees/review-XXX -b proposal/XXX

# 2. 进入 worktree 审查代码
cd ../worktrees/review-XXX

# 3. 运行测试
npm test

# 4. 查看代码变更
git diff main..proposal/XXX

# 5. 在 PR 中发表评论
# GitHub/GitLab PR 评论

# 6. 审查完成后清理
cd ..
git worktree remove review-XXX
```

---

#### 场景 3: 并行处理多个提案

```bash
# IDE 需要同时处理 proposal-001 和 proposal-002

# 1. 创建两个 worktree
git worktree add ../worktrees/proposal-001 -b proposal/001
git worktree add ../worktrees/proposal-002 -b proposal/002

# 2. 在两个工作目录间切换
cd ../worktrees/proposal-001  # 处理提案 1
# ... 开发 ...

cd ../proposal-002  # 切换到提案 2
# ... 开发 ...

# 3. 每个 worktree 独立提交
cd ../worktrees/proposal-001
git add . && git commit -m "feat: 提案 001 完成"

cd ../proposal-002
git add . && git commit -m "feat: 提案 002 完成"
```

---

### Worktree 管理命令速查

| 命令 | 说明 | 示例 |
|------|------|------|
| `git worktree add <路径> <分支>` | 创建新的 worktree | `git worktree add ../worktrees/feat-1 -b feature/1` |
| `git worktree list` | 列出所有 worktree | `git worktree list` |
| `git worktree remove <路径>` | 删除 worktree | `git worktree remove ../worktrees/feat-1` |
| `git worktree prune` | 清理无效的 worktree | `git worktree prune` |
| `git worktree move <旧路径> <新路径>` | 移动 worktree | `git worktree move old-path new-path` |

---

### Worktree 最佳实践

#### ✅ 应该做的

1. **每个提案/功能使用独立 worktree**
   - 保持工作目录清晰
   - 避免代码冲突

2. **定期清理已完成的 worktree**
   ```bash
   # 每周清理一次
   git worktree prune
   ```

3. **使用清晰的命名**
   - `proposal-001` ✅
   - `feat-1` ⚠️
   - `test` ❌

4. **为 worktree 设置独立的 IDE 工作区**
   - VS Code: 为每个 worktree 打开独立窗口
   - 保存为 `.code-workspace` 文件

#### ❌ 不应该做的

1. ❌ **在 main 分支直接开发**
   ```bash
   # 错误做法
   cd main
   git checkout main
   # 直接修改代码...
   ```

2. ❌ **多个功能混在一个 worktree**
   ```bash
   # 错误做法
   cd worktrees/mixed
   # 同时修改多个不相关的功能...
   ```

3. ❌ **长期保留不用的 worktree**
   ```bash
   # 错误做法
   # worktree 堆积，占用大量磁盘空间
   ```

---

## 文档资源复用指南

### 文档分类与复用策略

#### 类别 1: 核心架构文档（完全复用）

**文档列表**：

1. **FINAL_ARCHITECTURE.md**
   - **路径**: `docs/architecture/FINAL_ARCHITECTURE.md`
   - **复用建议**: ✅ 完全复用
   - **内容**: 6 层系统架构、核心模块详解
   - **更新频率**: 低（架构稳定后基本不变）

2. **COLLABORATION_RULES_v3.md**
   - **路径**: `根目录/COLLABORATION_RULES_v3.md`
   - **复用建议**: ✅ 完全复用
   - **内容**: 投票规则、权重计算、法定人数
   - **更新频率**: 中（根据协作反馈优化）

**复用方法**：
- 直接引用，无需修改
- 作为新 IDE 的必读文档
- 在 IDE 配置中链接到这些文档

---

#### 类别 2: 协作流程文档（优化后复用）

**文档列表**：

1. **IDE_ONBOARDING.md**
   - **路径**: `docs/collaboration/IDE_ONBOARDING.md`
   - **复用建议**: ✅ 优化后复用
   - **优化点**: 添加 Worktree 流程说明

2. **ENVIRONMENT_RULES.md**
   - **路径**: `docs/collaboration/ENVIRONMENT_RULES.md`
   - **复用建议**: ✅ 优化后复用
   - **优化点**: 添加 Worktree 环境检查

3. **REGISTRATION_FLOW.md**
   - **路径**: `docs/collaboration/REGISTRATION_FLOW.md`
   - **复用建议**: ✅ 优化后复用
   - **优化点**: 添加 Worktree 配置步骤

**优化方法**：
- 在现有文档中添加 Worktree 相关章节
- 提供 Worktree 配置示例
- 更新流程图和示例

---

#### 类别 3: 项目文档（部分复用）

**文档列表**：

1. **CLOSECLAW_README.md**
   - **路径**: `根目录/CLOSECLAW_README.md`
   - **复用建议**: ⚠️ 部分复用
   - **复用内容**: 项目概述、核心特性
   - **待更新内容**: 项目结构、快速开始

2. **README.md**
   - **路径**: `根目录/README.md`
   - **复用建议**: ✅ 完全复用
   - **内容**: 用户视角的项目说明
   - **更新频率**: 低

3. **MIGRATION_SUMMARY.md**
   - **路径**: `根目录/MIGRATION_SUMMARY.md`
   - **复用建议**: ⚠️ 部分复用
   - **复用内容**: 迁移总结、架构对比
   - **待归档内容**: 临时性迁移细节

**处理方法**：
- 保留用户视角的文档
- 归档临时性文档到 `docs/archive/`
- 更新项目结构说明

---

#### 类别 4: 历史文档（归档）

**待归档文档**：

1. **DOCUMENTATION_SUMMARY.md**
   - **路径**: `根目录/DOCUMENTATION_SUMMARY.md`
   - **建议**: 归档到 `docs/archive/`
   - **原因**: 已被 docs/README.md 替代

2. **LEGACY_RESOURCES_SUMMARY.md**
   - **路径**: `根目录/LEGACY_RESOURCES_SUMMARY.md`
   - **建议**: 保留但标记为历史
   - **原因**: 对了解项目历史有价值

**归档方法**：
```bash
# 移动文档到归档目录
mv DOCUMENTATION_SUMMARY.md docs/archive/
mv LEGACY_RESOURCES_SUMMARY.md docs/archive/

# 在原位置创建重定向说明
# 文件：DOCUMENTATION_SUMMARY.md
# 内容：本文档已归档，请查看 docs/archive/DOCUMENTATION_SUMMARY.md
```

---

### 文档复用检查清单

在复用文档前，请检查：

- [ ] **文档时效性**: 是否为最新版本？
- [ ] **架构一致性**: 是否与当前架构一致？
- [ ] **链接有效性**: 内部链接是否仍然有效？
- [ ] **示例准确性**: 代码示例是否仍然适用？
- [ ] **依赖关系**: 是否依赖已删除的模块？

---

## IDE 协作流程优化

### 优化后的完整协作流程

#### 阶段 1: 提案发起

```mermaid
graph LR
    A[IDE 发现需求] --> B[环境检查]
    B --> C[编写提案文档]
    C --> D[提供源码/分支]
    D --> E[发起投票]
```

**详细步骤**：

1. **环境检查**
   ```bash
   # 1. 检查当前环境
   git status
   git branch
   
   # 2. 确认在正确的分支
   # 应该在 main 或 develop 分支发起提案
   
   # 3. 检查是否有未提交的更改
   # 如有，先提交或暂存
   ```

2. **编写提案文档**
   ```markdown
   # 代码修改提案：[提案名称]
   
   > **提案 ID**: [编号]
   > **提案级别**: [一级/二级/三级]
   > **发起者**: [IDE 名称]
   > **发起日期**: [日期]
   > **状态**: 🟡 投票中
   
   ---
   
   ## 📋 提案说明
   
   [详细描述修改内容、目的、影响范围]
   
   ---
   
   ## 🔗 源码参考
   
   - [ ] 提供源码片段
   - [ ] Git 分支：`proposal/XXX`
   - [ ] 修改文件列表：
     - `src/core/voter.js`
     - `src/core/arbitrator.js`
   
   ---
   
   ## 🗳️ 投票表
   
   [投票表格]
   ```

3. **创建 Worktree 并实现**
   ```bash
   # 1. 创建 worktree
   git worktree add ../worktrees/proposal-XXX -b proposal/XXX
   
   # 2. 进入 worktree
   cd ../worktrees/proposal-XXX
   
   # 3. 实现功能
   # ... 编写代码 ...
   
   # 4. 提交但不推送（等待投票通过）
   git add .
   git commit -m "feat: 实现提案 XXX"
   ```

---

#### 阶段 2: 投票参与

```mermaid
graph LR
    A[收到投票通知] --> B[阅读提案]
    B --> C[审查源码]
    C --> D[发表意见]
    D --> E[投票]
    E --> F[等待结果]
```

**详细步骤**：

1. **阅读提案**
   ```bash
   # 1. 阅读提案文档
   cat ../../votes/proposal-XXX.md
   
   # 2. 查看提案级别和法定人数
   # 确定需要多少 IDE 参与
   ```

2. **审查源码**
   ```bash
   # 1. 创建审查用 worktree
   git worktree add ../worktrees/review-XXX -b proposal/XXX
   
   # 2. 进入 worktree
   cd ../worktrees/review-XXX
   
   # 3. 查看代码变更
   git diff main..proposal/XXX
   
   # 4. 运行测试（如有）
   npm test
   
   # 5. 检查代码质量
   npm run lint
   ```

3. **投票**
   - 在提案文档中填写投票态度
   - 如反对，必须提供理由
   - 可提出改进建议

---

#### 阶段 3: 投票执行

```mermaid
graph LR
    A[投票通过] --> B[推送代码]
    B --> C[创建 PR]
    C --> D[最终审查]
    D --> E[合并到 main]
    E --> F[清理 worktree]
```

**详细步骤**：

1. **投票通过后**
   ```bash
   # 1. 进入提案 worktree
   cd ../worktrees/proposal-XXX
   
   # 2. 确保代码是最新的
   git pull origin proposal/XXX
   
   # 3. 推送到远程
   git push -u origin proposal/XXX
   ```

2. **创建 Pull Request**
   - 在 GitHub/GitLab 创建 PR
   - 链接到投票文档
   - 说明修改内容和影响

3. **最终审查**
   ```bash
   # 其他 IDE 审查 PR
   # 1. 创建审查 worktree
   git worktree add ../worktrees/pr-review-XXX -b proposal/XXX
   
   # 2. 审查代码
   # 3. 在 PR 中发表评论
   ```

4. **合并与清理**
   ```bash
   # 1. 合并到 main
   git checkout main
   git merge proposal/XXX
   
   # 2. 推送到远程
   git push origin main
   
   # 3. 清理 worktree
   cd ..
   git worktree remove proposal-XXX
   
   # 4. 删除远程分支（可选）
   git push origin --delete proposal/XXX
   ```

---

### 协作效率提升建议

#### 1. 自动化检查

**Git Hooks 配置**：

创建 `.husky/pre-commit` 文件：

```bash
#!/bin/sh

# 检查是否在正确的分支
current_branch=$(git branch --show-current)
if [ "$current_branch" = "main" ]; then
  echo "❌ 禁止直接在 main 分支提交！"
  echo "请创建 worktree 并在提案分支开发"
  exit 1
fi

# 运行代码检查
npm run lint

# 运行测试
npm test
```

**安装 Hooks**：

```bash
# 安装 Husky
npm install husky --save-dev
npx husky install

# 添加 pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm test"
```

---

#### 2. IDE 配置优化

**VS Code 工作区配置**：

创建 `.vscode/workspaces.code-workspace`：

```json
{
  "folders": [
    {
      "name": "main",
      "path": "../main"
    },
    {
      "name": "proposal-001",
      "path": "../worktrees/proposal-001"
    },
    {
      "name": "proposal-002",
      "path": "../worktrees/proposal-002"
    }
  ],
  "settings": {
    "git.autofetch": true,
    "git.confirmSync": false
  }
}
```

---

#### 3. 文档模板

**提案文档模板**：

创建 `templates/proposal-template.md`：

```markdown
# 代码修改提案：[提案名称]

> **提案 ID**: [自动编号]
> **提案级别**: [一级/二级/三级]
> **发起者**: [@IDE 名称]
> **发起日期**: [YYYY-MM-DD]
> **状态**: 🟡 投票中
> **Worktree 分支**: `proposal/[编号]`

---

## 📋 提案说明

### 背景
[为什么需要这个修改？]

### 目标
[这个修改要达到什么目的？]

### 实现方案
[如何实现？技术方案是什么？]

### 影响范围
[会影响哪些模块？]

### 风险评估
[有什么潜在风险？如何缓解？]

---

## 🔗 源码参考

- **Git 分支**: `proposal/[编号]`
- **Worktree 路径**: `../worktrees/proposal-[编号]`
- **修改文件列表**:
  - [ ] `src/core/voter.js` - [修改说明]
  - [ ] `src/core/arbitrator.js` - [修改说明]
  - [ ] `tests/voter.test.js` - [测试文件]

---

## 🗳️ 投票表

### IDE 投票

| IDE | 态度 | 得分 | 备注 |
|-----|------|------|------|
| [IDE1] | ⬜ | 0 | |
| [IDE2] | ⬜ | 0 | |

**统计**:
- 参与数：0/17
- 赞同数：0
- 反对数：0
- IDE 总得分：0

---

### 用户投票

| 用户 | 态度 | 得分 | 备注 |
|-----|------|------|------|
| 用户 | ⬜ | 0 | |

**统计**:
- 参与：是/否
- 用户得分：0

---

## 📊 最终统计

| 项目 | 值 |
|------|-----|
| IDE 总得分 | 0 |
| 用户得分 | 0 |
| 综合总票数 | 0 |
| 反对票数量 | 0 |
| 法定人数 | 是/否 |
| **通过状态** | ⬜ |

---

## 💬 讨论区

[在此发表讨论意见]

---

## 📝 更新日志

- [日期] - 创建提案
- [日期] - 更新 [内容]
```

---

#### 4. 快速命令

创建 `scripts/git-utils.sh`：

```bash
#!/bin/bash

# CloseClaw Git 工具脚本

# 创建新的提案 worktree
create_proposal() {
  local id=$1
  local name=$2
  
  if [ -z "$id" ] || [ -z "$name" ]; then
    echo "用法：create_proposal <编号> <名称>"
    return 1
  fi
  
  git worktree add ../worktrees/proposal-$id -b proposal/$id
  echo "✅ 已创建 worktree: proposal-$id"
  echo "📂 路径：../worktrees/proposal-$id"
}

# 清理已完成的 worktree
cleanup_proposal() {
  local id=$1
  
  if [ -z "$id" ]; then
    echo "用法：cleanup_proposal <编号>"
    return 1
  fi
  
  git worktree remove ../worktrees/proposal-$id
  echo "✅ 已清理 worktree: proposal-$id"
}

# 列出所有 worktree
list_worktrees() {
  echo "📋 当前 worktrees:"
  git worktree list
}

# 切换到指定 worktree
switch_worktree() {
  local name=$1
  
  if [ -z "$name" ]; then
    echo "用法：switch_worktree <名称>"
    return 1
  fi
  
  cd ../worktrees/$name
  echo "✅ 已切换到：$name"
}

# 显示帮助
show_help() {
  echo "CloseClaw Git 工具"
  echo ""
  echo "用法:"
  echo "  create_proposal <编号> <名称>  - 创建提案 worktree"
  echo "  cleanup_proposal <编号>        - 清理提案 worktree"
  echo "  list_worktrees                 - 列出所有 worktree"
  echo "  switch_worktree <名称>         - 切换到指定 worktree"
  echo "  help                           - 显示帮助"
}

# 主程序
case "$1" in
  create)
    create_proposal "$2" "$3"
    ;;
  cleanup)
    cleanup_proposal "$2"
    ;;
  list)
    list_worktrees
    ;;
  switch)
    switch_worktree "$2"
    ;;
  *)
    show_help
    ;;
esac
```

**使用方法**：

```bash
# 添加执行权限
chmod +x scripts/git-utils.sh

# 创建提案
./scripts/git-utils.sh create 001 voting-feature

# 列出 worktrees
./scripts/git-utils.sh list

# 切换 worktree
./scripts/git-utils.sh switch proposal-001
```

---

## 实施路线图

### 阶段 1: 准备工作（第 1 周）

**目标**: 完成基础设置和文档准备

**任务**:

1. **Git 仓库初始化**
   ```bash
   # 1. 初始化 Git 仓库（如未初始化）
   git init
   
   # 2. 创建 main 分支
   git checkout -b main
   
   # 3. 初始提交
   git add .
   git commit -m "initial commit"
   ```

2. **创建 Worktree 基础设施**
   ```bash
   # 1. 创建 worktrees 目录
   mkdir -p worktrees
   
   # 2. 创建工具脚本目录
   mkdir -p scripts
   
   # 3. 创建模板目录
   mkdir -p templates
   ```

3. **配置 Git Hooks**
   ```bash
   # 安装 Husky
   npm install husky --save-dev
   npx husky install
   
   # 添加 pre-commit hook
   npx husky add .husky/pre-commit "npm run lint && npm test"
   ```

4. **部署工具脚本**
   - 复制 `git-utils.sh` 到 `scripts/`
   - 添加执行权限
   - 测试基本功能

5. **文档准备**
   - 创建 `templates/proposal-template.md`
   - 更新 `docs/collaboration/IDE_ONBOARDING.md`（添加 Worktree 说明）
   - 归档旧文档

**验收标准**:
- ✅ Git 仓库正常运行
- ✅ Worktree 创建成功
- ✅ Git Hooks 生效
- ✅ 工具脚本可用
- ✅ 文档模板就绪

---

### 阶段 2: 试点运行（第 2-3 周）

**目标**: 通过小型提案验证 Worktree 流程

**任务**:

1. **选择试点提案**
   - 选择 1-2 个一级决议提案
   - 影响范围小，风险低
   - 便于快速验证流程

2. **执行完整流程**
   ```bash
   # 1. 创建 worktree
   ./scripts/git-utils.sh create 001 simple-fix
   
   # 2. 开发
   cd worktrees/proposal-001
   # ... 编写代码 ...
   
   # 3. 提交
   git add .
   git commit -m "feat: 提案 001"
   
   # 4. 推送
   git push -u origin proposal-001
   
   # 5. 创建 PR
   # GitHub/GitLab 上创建
   
   # 6. 审查合并
   # 其他 IDE 审查
   
   # 7. 清理
   cd ../..
   ./scripts/git-utils.sh cleanup 001
   ```

3. **收集反馈**
   - IDE 使用体验
   - 流程顺畅度
   - 遇到的问题
   - 改进建议

4. **优化流程**
   - 根据反馈调整
   - 更新文档
   - 改进工具脚本

**验收标准**:
- ✅ 完成至少 2 个提案的完整流程
- ✅ 所有参与 IDE 熟悉 Worktree 操作
- ✅ 收集并处理反馈意见
- ✅ 流程文档更新

---

### 阶段 3: 全面推广（第 4 周起）

**目标**: 所有代码修改都遵循 Worktree 流程

**任务**:

1. **强制执行**
   - Git Hooks 禁止在 main 分支直接提交
   - 所有提案必须通过 worktree 开发
   - PR 审查成为标准流程

2. **持续优化**
   - 定期回顾流程效率
   - 收集 IDE 反馈
   - 持续改进工具和文档

3. **扩展功能**
   - 添加自动化测试
   - 集成 CI/CD
   - 性能监控

**验收标准**:
- ✅ 100% 的代码修改通过 worktree 流程
- ✅ 无直接在 main 分支的提交
- ✅ PR 审查成为常态
- ✅ IDE 满意度高

---

## 附录

### A. Git Worktree 常见问题

**Q1: Worktree 和普通分支有什么区别？**

A: 
- **分支**: 只是指向提交的指针
- **Worktree**: 独立的工作目录，可以检出不同分支

**Q2: Worktree 会占用多少磁盘空间？**

A:
- Git 对象数据库是共享的
- 每个 worktree 只占用工作文件的额外空间
- 通常每个 worktree 额外占用 10-50MB

**Q3: 如何在 worktree 间切换？**

A:
```bash
# 方法 1: cd 切换
cd ../worktrees/proposal-001

# 方法 2: 使用工具脚本
./scripts/git-utils.sh switch proposal-001
```

**Q4: Worktree 可以删除吗？**

A:
```bash
# 可以安全删除已完成的 worktree
git worktree remove ../worktrees/proposal-001

# 删除前确保：
# 1. 代码已合并
# 2. 没有未提交的更改
```

---

### B. 提案级别判断速查表

| 修改类型 | 决议级别 | IDE 人数 | 用户投票 |
|---------|---------|---------|---------|
| 拼写错误 | 一级 | ≥2 | 自愿 |
| 代码格式 | 一级 | ≥2 | 自愿 |
| 简单注释 | 一级 | ≥2 | 自愿 |
| 简单 Bug 修复 | 一级 | ≥2 | 自愿 |
| 新增基础功能 | 二级 | ≥3 | **必须** |
| 性能优化 | 二级 | ≥3 | **必须** |
| 批量修改 | 二级 | ≥3 | **必须** |
| 核心架构 | 三级 | ≥8 | **必须** |
| 主业务流程 | 三级 | ≥8 | **必须** |
| 核心功能 | 三级 | ≥8 | **必须** |
| 数据安全 | 三级 | ≥8 | **必须** |

---

### C. 投票计算公式速查

```
IDE 得分 = (赞同数 × 1) + (反对数 × -1)

用户得分 = 
  - 赞同：IDE 得分 × 1/2
  - 反对：IDE 得分 × 1/2（反向扣除）
  - 弃权：0

综合总票数 = IDE 得分 + 用户得分

通过条件 = 综合总票数 > 反对票数量
           AND
           满足法定人数
```

**示例**：
```
5 个 IDE 赞同，2 个 IDE 反对，用户赞同

IDE 得分 = 5×1 + 2×(-1) = 3
用户得分 = 3 × 1/2 = 1.5
综合总票数 = 3 + 1.5 = 4.5
反对票数量 = 2
法定人数 = 5 (二级决议) ✓

结果：4.5 > 2 → ✅ 通过
```

---

### D. 相关文档链接

- [协作规则 v3.0](./COLLABORATION_RULES_v3.md)
- [IDE 协作机制引导](./docs/collaboration/IDE_ONBOARDING.md)
- [环境拓扑与进度提取](./docs/collaboration/ENVIRONMENT_RULES.md)
- [新 IDE 注册流程](./docs/collaboration/REGISTRATION_FLOW.md)
- [最终架构文档](./docs/architecture/FINAL_ARCHITECTURE.md)
- [任务规划](./docs/planning/TASK_PLANNING.md)

---

### E. 工具脚本完整列表

| 脚本 | 路径 | 用途 |
|------|------|------|
| Git 工具 | `scripts/git-utils.sh` | Worktree 管理 |
| 提案模板 | `templates/proposal-template.md` | 提案文档模板 |
| Git Hooks | `.husky/pre-commit` | 提交前检查 |
| VS Code 工作区 | `.vscode/workspaces.code-workspace` | 多 worktree 配置 |

---

> **本方案自发布之日起生效**
> **CloseClaw - 公平、透明、高效的多智能体协作** 🚀
