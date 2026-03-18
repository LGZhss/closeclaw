# CloseClaw 项目文件结构

> **创建日期**: 2026-03-13
> **用途**: 完整说明项目文件结构和用途
> **版本**: 1.0.0

---

## 📂 完整文件树

```
.closeclaw/
│
├── 📄 README.md                          # ⭐ 用户文档（对外介绍）
├── 📄 CLOSECLAW_README.md                # ⭐ 项目概述（对内说明）
├── 📄 COLLABORATION_RULES_v3.md          # ⭐⭐⭐ 核心协作规则（必读）
├── 📄 NEW_IDE_ONBOARDING.md              # ⭐⭐⭐ 新 IDE 引导文档（必读）
│
├── 📄 DOCUMENTATION_SUMMARY.md           # 文档总结
├── 📄 MIGRATION_SUMMARY.md               # 迁移总结
├── 📄 LEGACY_RESOURCES_SUMMARY.md        # 历史资源总结
├── 📄 GITHUB_REPOSITORIES.md             # GitHub 仓库列表
│
├── 📦 package.json                       # 项目依赖配置
├── ⚙️  tsconfig.json                      # TypeScript 配置
├── 🔐 .env.example                       # 环境变量模板
├── 🚫 .gitignore                         # Git 忽略规则
│
├── 📁 scripts/                           # ⭐ 工具脚本目录
│   ├── 📄 git-utils.sh                   # ⭐⭐⭐ Git Worktree 管理工具
│   └── 📄 init-dev-dir.sh                # ⭐⭐ 开发环境初始化脚本
│
├── 📁 templates/                         # ⭐ 模板文件目录
│   └── 📄 proposal-template.md           # ⭐⭐⭐ 标准提案模板
│
├── 📁 src/                               # ⭐ 源代码目录
│   ├── 📄 index.ts                       # ⭐⭐ 核心编排器（入口）
│   ├── 📄 config.ts                      # ⭐⭐ 配置常量
│   ├── 📄 types.ts                       # ⭐⭐ TypeScript 类型定义
│   ├── 📄 logger.ts                      # ⭐ 日志模块
│   ├── 📄 db.ts                          # ⭐⭐ 数据库层（SQLite）
│   ├── 📄 router.ts                      # ⭐⭐ 消息路由
│   ├── 📄 group-queue.ts                 # ⭐ 队列管理
│   ├── 📄 ipc.ts                         # ⭐ IPC 通信
│   ├── 📄 task-scheduler.ts              # ⭐ 任务调度器
│   │
│   └── 📁 channels/                      # ⭐ 通道系统
│       ├── 📄 registry.ts                # ⭐⭐ 通道注册表
│       └── 📄 index.ts                   # ⭐ 通道索引
│
├── 📁 docs/                              # ⭐ 文档目录
│   ├── 📄 README.md                      # ⭐⭐ 文档索引
│   │
│   ├── 📁 architecture/                  # 架构文档
│   │   └── 📄 FINAL_ARCHITECTURE.md      # ⭐⭐⭐ 最终架构文档
│   │
│   ├── 📁 collaboration/                 # ⭐⭐⭐ 协作文档（核心）
│   │   ├── 📄 README.md                  # ⭐⭐⭐ 协作文档索引
│   │   ├── 📄 QUICK_GUIDE.md             # ⭐⭐⭐ 快速参考指南
│   │   ├── 📄 WORKFLOW_OPTIMIZATION.md   # ⭐⭐⭐ 完整优化方案
│   │   ├── 📄 DEDICATED_DEV_DIR.md       # ⭐⭐ 专门目录说明
│   │   ├── 📄 ENVIRONMENT_SETUP.md       # ⭐⭐ 环境配置指南
│   │   ├── 📄 WORKTREE_LOCATION.md       # ⭐ Worktree 位置说明
│   │   ├── 📄 UPDATE_NOTES.md            # ⭐ 更新说明
│   │   ├── 📄 IMPLEMENTATION_SUMMARY.md  # ⭐ 实施总结
│   │   ├── 📄 COMPLETE_SUMMARY.md        # ⭐ 完整总结
│   │   ├── 📄 FINAL_SUMMARY.md           # ⭐ 最终总结
│   │   ├── 📄 OPTIMIZATION_COMPLETE.md   # ⭐ 优化完成公告
│   │   ├── 📄 IDE_ONBOARDING.md          # ⭐ IDE 引导（旧版）
│   │   ├── 📄 ENVIRONMENT_RULES.md       # ⭐ 环境规则
│   │   └── 📄 REGISTRATION_FLOW.md       # ⭐ 注册流程
│   │
│   └── 📁 planning/                      # 规划文档
│       └── 📄 TASK_PLANNING.md           # ⭐⭐ 任务规划
│
├── 📁 groups/                            # ⭐ 群组记忆目录
│   ├── 📁 global/
│   │   └── 📄 CONTEXT.md                  # ⭐⭐ 全局记忆文件
│   └── 📁 main/
│       └── 📄 CONTEXT.md                  # ⭐⭐ 主通道记忆文件
│
├── 📁 votes/                             # ⭐⭐⭐ 投票文档目录（决议区域）
│   ├── 📄 proposal-001.md                # 提案 001
│   ├── 📄 proposal-002.md                # 提案 002
│   └── ...
│
├── 📁 scripts/                           # ⭐ 工具脚本
│           └── 📄 index.ts
│
├── 📁 store/                             # 运行时数据存储
│   └── 📄 messages.db                    # SQLite 数据库文件
│
├── 📁 data/                              # 应用状态数据
│   ├── 📁 sessions/                      # 会话数据
│   ├── 📁 ipc/                           # IPC 通信数据
│   └── 📁 env/                           # 环境变量
│
├── 📁 logs/                              # 日志目录
│   ├── 📄 nanoclaw.log                   # 主日志
│   └── 📄 nanoclaw.error.log             # 错误日志
│
└── 📁 tests/                             # 测试文件
    └── 📄 config.test.ts                 # 配置测试
```

---

## 🎯 关键目录说明

### 1. 根目录文件

#### ⭐⭐⭐ 必读文件

| 文件 | 用途 | 阅读优先级 |
|------|------|-----------|
| `NEW_IDE_ONBOARDING.md` | 新 IDE 引导 | 第一次必读 |
| `RULES.md` | 协作规则 | 每次参与前复习 |
| `docs/02-collaboration/workflow.md` | 工作流程 | 日常查阅 |

#### 📚 项目文档

| 文件 | 用途 | 说明 |
|------|------|------|
| `README.md` | 用户文档 | 对外介绍项目 |
| `CLOSECLAW_README.md` | 项目概述 | 对内详细说明 |
| `DOCUMENTATION_SUMMARY.md` | 文档总结 | 所有文档概览 |
| `MIGRATION_SUMMARY.md` | 迁移总结 | 从旧项目迁移的总结 |
| `LEGACY_RESOURCES_SUMMARY.md` | 历史资源 | 旧项目资源说明 |
| `GITHUB_REPOSITORIES.md` | 仓库列表 | GitHub 仓库信息 |

#### ⚙️ 配置文件

| 文件 | 用途 | 说明 |
|------|------|------|
| `package.json` | 依赖配置 | npm 依赖和脚本 |
| `tsconfig.json` | TS 配置 | TypeScript 编译配置 |
| `.env.example` | 环境模板 | 环境变量示例 |
| `.gitignore` | Git 规则 | 忽略文件规则 |

---

### 2. scripts/ - 工具脚本

#### ⭐⭐⭐ git-utils.sh

**用途**: Git Worktree 管理工具

**常用命令**:
```bash
# 创建提案 worktree
./scripts/git-utils.sh create 001 feature-name

# 切换 worktree
./scripts/git-utils.sh switch proposal-001

# 列出所有
./scripts/git-utils.sh list

# 清理
./scripts/git-utils.sh cleanup 001

# 查看帮助
./scripts/git-utils.sh help
```

**自动创建位置**: `~/dev/closeclaw-proposals/proposal-001`

---

#### ⭐⭐ init-dev-dir.sh

**用途**: 开发环境初始化

**运行一次即可**:
```bash
./scripts/init-dev-dir.sh
```

**自动完成**:
- 创建 `~/dev/closeclaw-proposals/` 目录
- 创建 `~/dev/closeclaw-votes/` 目录
- 配置环境变量到 shell 配置文件

---

### 3. templates/ - 模板文件

#### ⭐⭐⭐ proposal-template.md

**用途**: 标准提案文档模板

**使用方法**:
```bash
# 复制模板
cp templates/proposal-template.md votes/proposal-001.md

# 编辑内容
# 填写提案信息、修改内容、影响范围等
```

**包含内容**:
- 提案基本信息（ID、级别、发起者等）
- 提案说明（背景、目标、实现方案等）
- 源码参考
- IDE 投票表（17 个 IDE）
- 用户投票表
- 最终统计
- 讨论区
- 更新日志

---

### 4. src/ - 源代码

#### ⭐⭐ index.ts

**用途**: 核心编排器（入口文件）

**功能**:
- 消息轮询
- Agent 调用
- 任务调度
- 通道管理

---

#### ⭐⭐ config.ts

**用途**: 配置常量

**包含**:
- 助手名称（默认：Andy）
- 轮询间隔
- 容器配置
- 触发词模式

---

#### ⭐⭐ types.ts

**用途**: TypeScript 类型定义

**定义**:
- Channel 接口
- IncomingMessage / OutgoingMessage
- RegisteredGroup
- ScheduledTask
- 数据库结构

---

#### ⭐⭐ db.ts

**用途**: 数据库层（SQLite）

**功能**:
- 消息存储
- 群组管理
- 任务管理
- 会话管理
- 路由状态

**表结构**:
- messages - 消息表
- registered_groups - 注册群组表
- scheduled_tasks - 定时任务表
- task_run_logs - 任务运行日志
- sessions - 会话表
- router_state - 路由状态表

---

#### ⭐⭐ router.ts

**用途**: 消息路由

**功能**:
- 消息格式化
- 触发词匹配
- 响应格式化
- 消息处理

---

#### ⭐⭐ 其他核心模块

| 文件 | 用途 | 说明 |
|------|------|------|
| `logger.ts` | 日志模块 | Pino 日志 |
| `group-queue.ts` | 队列管理 | 并发控制 |
| `ipc.ts` | IPC 通信 | 文件系统 IPC |
| `task-scheduler.ts` | 任务调度 | 定时任务 |

---

### 5. docs/ - 文档目录

#### ⭐⭐⭐ collaboration/ - 协作文档

**核心中的核心**，所有协作相关的文档都在这里。

**阅读顺序**:
1. `README.md` - 导航索引
2. `QUICK_GUIDE.md` - 快速参考
3. `WORKFLOW_OPTIMIZATION.md` - 完整方案
4. `DEDICATED_DEV_DIR.md` - 专门目录说明
5. `ENVIRONMENT_SETUP.md` - 环境配置

---

#### ⭐⭐ architecture/ - 架构文档

**FINAL_ARCHITECTURE.md** - 完整架构说明

**内容**:
- 6 层系统架构
- 核心模块详解
- 数据流向
- 安全模型

---

#### ⭐⭐ planning/ - 规划文档

**TASK_PLANNING.md** - 任务规划

**内容**:
- 任务分解
- 优先级排序
- 进度跟踪

---

### 6. groups/ - 群组记忆

#### ⭐⭐ global/CONTEXT.md

**用途**: 全局记忆文件

**内容**:
- 全局偏好
- 共享事实
- 跨组上下文

---

#### ⭐⭐ main/CONTEXT.md

**用途**: 主通道记忆文件

**内容**:
- 主通道特定记忆
- 管理操作记录
- 全局配置

---

### 7. votes/ - 投票文档（决议区域）⭐⭐⭐

**这是最重要的决议区域！**

**位置**: 项目根目录的 `votes/` 文件夹

**用途**: 所有代码修改提案和投票都在这里进行

**文件命名**: `proposal-XXX.md`（XXX 为提案编号）

**示例结构**:
```
votes/
├── proposal-001.md      # 第一个提案
├── proposal-002.md      # 第二个提案
└── ...
```

---

#### 如何参与投票

**步骤 1: 查看提案**
```bash
# 列出所有提案
ls votes/

# 阅读提案内容
cat votes/proposal-001.md
```

**步骤 2: 审查代码（可选）**
```bash
# 创建审查 worktree
./scripts/git-utils.sh review 001

# 查看代码变更
cd ~/dev/closeclaw-proposals/review-001
git diff main..proposal/001
```

**步骤 3: 填写投票**
编辑 `votes/proposal-001.md`，在投票表中填写：

```markdown
### IDE 投票

| IDE | 态度 | 得分 | 备注 |
|-----|------|------|------|
| 你的 IDE 名称 | ✅ 赞同 | +1 | 很好的改进！ |
```

**步骤 4: 提交投票**
```bash
git add votes/proposal-001.md
git commit -m "vote: proposal-001 - 赞同"
git push
```

---

#### 投票规则速查

**三级决议制度**:

| 级别 | IDE 人数 | 用户投票 | 适用场景 |
|------|---------|---------|---------|
| 一级 | ≥2 | 自愿 | 拼写错误、格式调整 |
| 二级 | ≥5 | **必须** | 新增功能、性能优化 |
| 三级 | ≥8 | **必须** | 核心架构、主流程 |

**计算公式**:
```
IDE 得分 = 赞同数×1 + 反对数×(-1)
用户得分 = IDE 得分 × 1/2
综合总票数 = IDE 得分 + 用户得分

通过条件 = 综合总票数 > 反对票数量
           AND
           满足法定人数
```

---

### 8. scripts/ - 工具脚本

**用途**: Git Worktree 管理和环境初始化工具

**包含**:
- `init-dev-dir.ps1` - PowerShell 版本的环境初始化（Windows）
- `init-dev-dir.sh` - Bash 版本的环境初始化（Linux/Mac）
- `git-utils.ps1` - PowerShell 版本的 worktree 管理（Windows）
- `git-utils.sh` - Bash 版本的 worktree 管理（Linux/Mac）

---

### 9. store/ - 运行时数据

**用途**: 存储运行时数据

**包含**:
- `messages.db` - SQLite 数据库文件
- 其他运行时数据

**注意**: 此目录内容通常不提交到 Git

---

### 10. data/ - 应用状态

**用途**: 应用状态数据

**子目录**:
- `sessions/` - 会话数据
- `ipc/` - IPC 通信数据
- `env/` - 环境变量

**注意**: 此目录内容通常不提交到 Git

---

### 11. logs/ - 日志目录

**用途**: 日志文件

**包含**:
- `nanoclaw.log` - 主日志
- `nanoclaw.error.log` - 错误日志

**注意**: 日志文件通常不提交到 Git

---

### 12. tests/ - 测试文件

**用途**: 测试代码

**包含**:
- `config.test.ts` - 配置测试
- 其他测试文件

---

## 🗺️ 文件用途地图

### 新 IDE 第一次参与

```
1. NEW_IDE_ONBOARDING.md (引导)
   ↓
2. RULES.md (规则)
   ↓
3. docs/02-collaboration/workflow.md (工作流程)
   ↓
4. scripts/init-dev-dir.sh (初始化)
   ↓
5. votes/ (查看提案)
```

---

### 发起提案

```
1. templates/proposal-template.md (复制模板)
   ↓
2. votes/proposal-XXX.md (填写内容)
   ↓
3. scripts/git-utils.sh create (创建 worktree)
   ↓
4. ~/dev/closeclaw-proposals/proposal-XXX (开发)
   ↓
5. 推送代码 → 创建 PR
   ↓
6. votes/proposal-XXX.md (更新投票)
```

---

### 参与投票

```
1. votes/proposal-XXX.md (阅读提案)
   ↓
2. 审查代码（可选）
   ↓
3. votes/proposal-XXX.md (填写投票)
   ↓
4. 提交并推送
```

---

## 📊 文件重要性总结

### ⭐⭐⭐ 必须了解

| 文件/目录 | 用途 | 频率 |
|----------|------|------|
| `NEW_IDE_ONBOARDING.md` | 新 IDE 引导 | 第一次 |
| `RULES.md` | 协作规则 | 每次 |
| `docs/02-collaboration/workflow.md` | 工作流程 | 每天 |
| `votes/` | 投票区域 | 每次提案 |
| `scripts/git-utils.sh` | Worktree 工具 | 每天 |
| `templates/proposal-template.md` | 提案模板 | 每次提案 |

---

### ⭐⭐ 经常使用

| 文件/目录 | 用途 | 频率 |
|----------|------|------|
| `docs/README.md` | 文档导航 | 经常 |
| `docs/02-collaboration/workflow.md` | 完整流程 | 经常 |
| `scripts/init-dev-dir.sh` | 环境初始化 | 一次 |
| `src/index.ts` | 核心代码 | 开发时 |
| `groups/global/CONTEXT.md` | 全局记忆 | 经常 |

---

### ⭐ 参考查阅

| 文件/目录 | 用途 | 频率 |
|----------|------|------|
| `docs/05-architecture/overview.md` | 架构文档 | 需要时 |
| `src/*.ts` | 源代码 | 开发时 |
| `docs/07-roadmap/tasks.md` | 任务规划 | 需要时 |
| 其他文档 | 参考 | 需要时 |

---

## 🎯 快速定位

### 我要...

**查看提案** → `votes/`

**发起提案** → `templates/proposal-template.md`

**参与投票** → `votes/proposal-XXX.md`

**创建 worktree** → `scripts/git-utils.sh`

**查看文档** → `docs/README.md`

**了解规则** → `RULES.md`

**学习架构** → `docs/05-architecture/overview.md`

**配置环境** → `docs/02-collaboration/environment.md`

**快速参考** → `docs/02-collaboration/workflow.md`

---

## ✅ 检查清单

### 新 IDE 熟悉文件结构

- [ ] 知道 `votes/` 是投票区域
- [ ] 知道 `RULES.md` 是核心规则
- [ ] 知道 `scripts/git-utils.sh` 是 Worktree 工具
- [ ] 知道 `templates/proposal-template.md` 是提案模板
- [ ] 知道 `docs/02-collaboration/` 是协作文档目录
- [ ] 知道 `~/dev/closeclaw-proposals/` 是工作目录

---

> **记住这三个核心位置**：
> 1. **投票区域**: `votes/`
> 2. **规则文档**: `COLLABORATION_RULES_v3.md`
> 3. **工作目录**: `~/dev/closeclaw-proposals/`
> 
> **CloseClaw - 清晰的file structure，高效的协作** 🚀
