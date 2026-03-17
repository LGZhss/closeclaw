# CloseClaw 项目文件结构

> **创建日期**: 2026-03-13
> **用途**: 完整说明项目文件结构和用途
> **版本**: 2.0.0

---

## 📂 完整文件树

```
closeclaw/
│
├── 📄 README.md                          # ⭐ 用户文档（对外介绍）
├── 📄 RULES.md                           # ⭐⭐⭐ 核心协作规则（必读）
├── 📄 SECURITY.md                        # 安全策略
│
├── 📦 package.json                       # 项目依赖配置
├── ⚙️ tsconfig.json                      # TypeScript 配置
├── 🔐 .env.example                       # 环境变量模板
├── 🚫 .gitignore                         # Git 忽略规则
│
├── 📁 scripts/                           # ⭐ 工具脚本目录
│   ├── 📄 git-utils.ps1                  # ⭐⭐⭐ Git Worktree 管理工具
│   ├── 📄 git-utils.sh                   # ⭐⭐⭐ Git Worktree 管理工具
│   ├── 📄 init-dev-dir.ps1               # ⭐⭐ 开发环境初始化脚本
│   ├── 📄 init-dev-dir.sh                # ⭐⭐ 开发环境初始化脚本
│   ├── 📄 auto-vote-stats.js             # 自动投票统计脚本
│   └── 📄 vote-tally.js                  # 投票统计工具
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
│   ├── 📁 channels/                      # ⭐ 通道系统
│   │   ├── 📄 registry.ts                # ⭐⭐ 通道注册表
│   │   └── 📄 index.ts                   # ⭐ 通道索引
│   │
│   ├── 📁 core/                          # ⭐ 核心协作逻辑
│   │   ├── 📄 agentRegistry.js           # 协作主体注册
│   │   ├── 📄 voter.js                   # 投票引擎
│   │   └── 📄 arbitrator.js              # 仲裁模块
│   │
│   ├── 📁 adapters/                      # ⭐ 模型适配器
│   │   └── ...                           # 多种 LLM 适配器
│   │
│   ├── 📁 sandbox/                       # ⭐ 沙盒执行环境
│   │   └── 📄 processExecutor.js         # 进程级隔离
│   │
│   └── 📁 tools/                         # ⭐ 工具管理
│       └── ...                           # 统一工具抽象
│
├── 📁 docs/                              # ⭐ 文档目录
│   ├── 📄 README.md                      # ⭐⭐ 文档索引
│   │
│   ├── 📁 02-collaboration/              # ⭐⭐⭐ 协作文档（核心）
│   │   ├── 📄 environment.md             # 环境配置指南
│   │   └── 📄 workflow.md                # 工作流程优化
│   │
│   ├── 📁 03-development/                # ⭐⭐ 开发指南
│   │   ├── 📄 onboarding.md              # ⭐⭐⭐ 新协作主体引导
│   │   └── 📄 ide-registration.md        # ⭐⭐ 注册流程
│   │
│   ├── 📁 04-reference/                  # ⭐ 技术参考
│   │   ├── 📄 file-structure.md          # 本文档
│   │   ├── 📄 registration-flow.md       # 注册流程详解
│   │   └── 📄 worktree-location.md       # Worktree 位置说明
│   │
│   ├── 📁 05-architecture/               # ⭐ 架构设计
│   │   └── 📄 overview.md                # ⭐⭐⭐ 系统架构
│   │
│   ├── 📁 06-registry/                   # ⭐ 注册中心
│   │   └── 📄 collaborators.md           # ⭐⭐ 协作主体注册表
│   │
│   ├── 📁 07-roadmap/                    # ⭐ 路线规划
│   │   └── 📄 future-plan.md             # ⭐⭐ 未来规划
│   │
│   ├── 📁 contributing/                  # 协作贡献
│   │   └── 📄 COLLABORATOR_ONBOARDING.md # 协作主体进场指引
│   │
│   └── 📁 archive/                       # 归档文档
│       └── ...                           # 历史文档
│
├── 📁 votes/                             # ⭐⭐⭐ 投票文档目录（决议区域）
│   ├── 📄 README.md                      # 投票目录说明
│   ├── 📄 proposal-000-example.md        # 示例提案
│   └── 📄 proposal-xxx.md                # 各类提案
│
├── 📁 registered_ide/                    # ⭐ 协作主体注册记录
│   └── 📄 xxx_registration.md            # 各协作主体注册文件
│
├── 📁 pr-drafts/                         # PR 草稿目录
│   └── 📁 proposal-xxx/                  # 各提案的 PR 草稿
│
├── 📁 worktrees/                         # ⭐ 并行任务工作树
│   └── 📁 proposal-xxx/                  # 各提案的工作树
│
├── 📁 store/                             # 运行时数据存储
│   └── 📄 messages.db                    # SQLite 数据库文件
│
├── 📁 data/                              # 应用状态数据
│   ├── 📁 sessions/                      # 会话数据
│   └── 📁 ipc/                           # IPC 通信数据
│
├── 📁 logs/                              # 日志目录
│   ├── 📄 nanoclaw.log                   # 主日志
│   └── 📄 nanoclaw.error.log             # 错误日志
│
└── 📁 tests/                             # ⭐ 测试目录
    ├── 📄 *.test.ts                      # 单元测试
    ├── 📁 e2e/                           # 端到端测试
    ├── 📁 integration/                   # 集成测试
    └── 📁 utils/                         # 测试工具
```

---

## 📌 核心文件说明

### 必读文件（优先级排序）

| 文件 | 优先级 | 说明 |
|------|--------|------|
| `RULES.md` | ⭐⭐⭐ | 核心协作规则，投票机制 |
| `docs/03-development/onboarding.md` | ⭐⭐⭐ | 新协作主体进场指引 |
| `docs/05-architecture/overview.md` | ⭐⭐ | 系统架构设计 |
| `docs/06-registry/collaborators.md` | ⭐⭐ | 协作主体注册表 |

### 投票与提案

| 目录/文件 | 说明 |
|-----------|------|
| `votes/` | 投票决议区域，所有提案和投票记录 |
| `templates/proposal-template.md` | 标准提案模板 |
| `scripts/auto-vote-stats.js` | 自动投票统计脚本 |

### 开发相关

| 目录/文件 | 说明 |
|-----------|------|
| `src/` | 源代码目录（TypeScript） |
| `tests/` | 测试文件目录 |
| `scripts/` | 工具脚本 |

---

## 🗳️ 投票规则快速参考

| 级别 | 法定人数 | 用户参与 | 适用场景 |
|------|---------|---------|---------|
| 一级 | ≥2 | 自愿 | 简单修改 |
| 二级 | ≥3 | 必须 | 功能新增 |
| 三级 | ≥5 | 必须 | 核心变更 |

**详细规则**: [RULES.md](../../RULES.md)

---

## 📝 注意事项

1. **代码修改先投票** - 严禁直接修改代码，必须先发起提案
2. **中文至上** - UI、任务摘要、沟通必须使用简体中文
3. **身份备案** - 协作主体必须在 `.subjects.json` 和 `registered_ide/` 注册

---

> **CloseClaw - 公平、透明、高效的多智能体协作** 🚀