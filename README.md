# CloseClaw - 个人 AI 助手

> 模型必读：请先阅读 [RULES.md](./RULES.md)
>
> **版本**: 3.0.0 (P027 三语言架构)  
> **基于**: NanoClaw 架构  
> **状态**: 🟢 P027 Phase 1 实施中

---

## 🚀 快速开始

### 方式一：一键启动（推荐）

**Windows**:
```bash
# 开发模式（热重载）
start-dev.bat

# 生产模式
start.bat
```

**Linux/Mac**:
```bash
# 开发模式（热重载）
./start-dev.sh

# 生产模式
./start.sh
```

### 方式二：手动安装

```bash
git clone <your-repo>/closeclaw.git
cd closeclaw
.\scripts\init-dev-dir.ps1    # 初始化环境（Windows）
./scripts/init-dev-dir.sh     # 初始化环境（Linux/Mac）
npm install                   # 安装依赖
npm run dev                   # 开发模式
# 或
npm run build && npm start    # 生产模式
```

### 配置

编辑 `.env` 文件：

#### 1. Telegram Bot Token（必需）
```bash
# 获取方式：与 @BotFather 对话创建 Bot
TELEGRAM_TOKEN=your-telegram-bot-token-here
ALLOWED_USER_IDS=your-telegram-user-id
```

#### 2. LLM API Keys（至少配置一个）
```bash
# 推荐：Zhipu AI（免费，中文支持好）
ZHIPU_API_KEY=your-zhipu-api-key

# 其他免费选项
OPENROUTER_API_KEY=...  # 350+ 免费模型
SILICONFLOW_API_KEY=... # DeepSeek 免费
CEREBRAS_API_KEY=...    # Llama 3.1 免费
MODELSCOPE_API_KEY=...  # Qwen 系列

# 系统配置
ASSISTANT_NAME=CloseClaw
WORKSPACE_DIR=E:\.closeclaw\data
```

#### 3. 验证配置
```bash
# 测试 LLM API 可用性
node scripts/test-llm-apis.js

# 测试 Telegram Bot Token
node scripts/test-zhipu-api.js
```

---

## ✨ 特性

- 🏗️ **三语言微内核架构** - Dart(控制平面) + Go(状态总线) + TS(沙盒执行)
- 🔒 **三级容灾降级** - L1/L2/L3 自动故障转移，确保 P021 基线始终可用
- 📱 **多通道支持** - Telegram、WhatsApp 等（通过技能添加）
- 🧠 **分层记忆** - 每个群组独立的 CONTEXT.md
- ⏰ **任务调度** - 定时任务和周期性任务
- 🤖 **Agent 集群** - 多 Agent 协作

---

## 📖 文档指引

### 🌟 新 IDE 必读（按顺序）

1. **[docs/01-getting-started/quickstart.md](./docs/01-getting-started/quickstart.md)** - 快速开始（5 分钟）
2. **[RULES.md](./RULES.md)** - 协作规则（10 分钟）
3. **[docs/03-development/ide-registration.md](./docs/03-development/ide-registration.md)** - 注册流程（5 分钟）

### 📚 核心文档

| 文档 | 说明 |
|------|------|
| [docs/04-reference/file-structure.md](./docs/04-reference/file-structure.md) | 文件结构详解 |
| [docs/05-architecture/overview.md](./docs/05-architecture/overview.md) | 三语言系统架构设计 |
| [docs/07-roadmap/future-plan.md](./docs/07-roadmap/future-plan.md) | 未来发展规划 |
| [docs/07-roadmap/P027-summary.md](./docs/07-roadmap/P027-summary.md) | ⭐ P027 提案总结 |
| [RULES.md](./RULES.md) | 协作规则 |
| [docs/06-registry/collaborators.md](./docs/06-registry/collaborators.md) | 协作主体注册 |

### 📂 完整文档目录

- **docs/01-getting-started/** - 新手入门
- **docs/02-collaboration/** - 协作机制
- **docs/03-development/** - 开发指南
- **docs/04-reference/** - 技术参考
- **docs/05-architecture/** - 架构设计
- **docs/06-registry/** - 注册中心
- **docs/07-roadmap/** - 路线规划

👉 完整文档列表：[docs/README.md](./docs/README.md)

---

## 🗳️ 决议区域

**投票目录**: [`votes/`](./votes/)

**发起提案**: `cp templates/proposal-template.md votes/proposal-001.md`

**参与投票**: 编辑 `votes/proposal-001.md` 中的投票表

**详细规则**: [RULES.md](./RULES.md)

---

## 🛠️ 工具脚本

```bash
./scripts/git-utils.ps1 create 001 feature-name   # 创建 worktree (Windows)
./scripts/git-utils.sh create 001 feature-name    # 创建 worktree (Linux/Mac)
./scripts/git-utils.ps1 switch proposal-001       # 切换 worktree
./scripts/git-utils.ps1 list                      # 列出所有
./scripts/git-utils.ps1 cleanup 001               # 清理
```

**工作目录**: `~/dev/closeclaw-proposals/`

---

## 📂 项目结构

```
closeclaw/
├── cmd/                      # 【新增】Dart 控制平面 (P027)
│   ├── bin/closeclaw.dart    # 主入口 → dart compile exe
│   ├── lib/core/             # 守护进程 & 审计中继
│   └── lib/mcp/              # MCP Server (mcp_dart)
├── kernel/                   # 【新增】Go 网络与状态总线 (P027)
│   ├── db/                   # SQLite 总线 (go-sqlite3)
│   ├── llm/                  # LLM API 适配器
│   ├── scheduler/            # 毫秒级任务调度器
│   └── router/               # 消息路由
├── src/                      # TypeScript 沙盒执行层
│   ├── index.ts              # L2/L3 降级入口
│   ├── adapters/             # LLM 适配器 (逐步迁入 kernel)
│   ├── channels/             # Telegram 等通道
│   └── sandbox/              # NPM 生态执行器
├── proto/                    # 【新增】跨语言协议定义 (P027)
│   └── messages.proto        # 含 trace_id 分布式追踪
├── votes/                    # ⭐ 投票决议区域
├── templates/                # 提案模板
├── scripts/                  # 工具脚本
├── docs/                     # 文档
├── groups/                   # 群组记忆
│   ├── global/CONTEXT.md      # 全局记忆
│   └── main/CONTEXT.md        # 主通道记忆
└── tests/                    # 测试 (92 测试用例全部通过)
```

详细说明：[docs/04-reference/file-structure.md](./docs/04-reference/file-structure.md)

---

## 🤝 协作流程

**提案流程**：复制模板 → 填写内容 → 创建 worktree → 开发 → PR → 投票

**决议级别**：
- 一级：≥2 IDE（简单修改）
- 二级：≥5 IDE + 用户投票（功能新增）
- 三级：≥8 IDE + 用户投票（核心变更）

**详细规则**: [RULES.md](./RULES.md)

---

## 🔧 开发

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm test

# 格式化
npm run format
```

---

## 🆘 需要帮助？

**新 IDE**: [docs/01-getting-started/quickstart.md](./docs/01-getting-started/quickstart.md)  
**快速参考**: [RULES.md](./RULES.md)  
**文件结构**: [docs/04-reference/file-structure.md](./docs/04-reference/file-structure.md)  
**全部文档**: [docs/README.md](./docs/README.md)

---

## 📜 许可证

Apache License 2.0

## 🙏 致谢

- [NanoClaw](https://github.com/qwibitai/nanoclaw) - 原始架构
- 免费 AI 模型：OpenRouter (26 种)、GitHub Models (20+ 种)

---

> **CloseClaw - 公平、透明、高效的多智能体协作** 🚀
