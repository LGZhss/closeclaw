# CloseClaw - 个人 AI 助手

> 模型必读：请先阅读 [RULES.md](./RULES.md)
>
> **版本**: 2.0.0  
> **基于**: NanoClaw 架构  
> **状态**: 🟢 开发中

---

## 🚀 快速开始

### 安装

```bash
git clone <your-repo>/closeclaw.git
cd closeclaw
./scripts/init-dev-dir.sh    # 初始化环境
npm install                   # 安装依赖
npm start                     # 启动
```

### 配置

编辑 `.env` 文件：
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
ASSISTANT_NAME=Andy
```

---

## ✨ 特性

- 🏗️ **微内核架构** - 单进程编排，易于定制
- 📱 **多通道支持** - Telegram、WhatsApp 等（通过技能添加）
- 🧠 **分层记忆** - 每个群组独立的 CLAUDE.md
- ⏰ **任务调度** - 定时任务和周期性任务
- 🤖 **Agent 集群** - 多 Agent 协作

---

## 📖 文档指引

### 🌟 新 IDE 必读（按顺序）

1. **[docs/contributing/IDE_ONBOARDING.md](./docs/contributing/IDE_ONBOARDING.md)** - 新 IDE 引导（5 分钟）
2. **[docs/guides/COLLABORATION_RULES_v3.md](./docs/guides/COLLABORATION_RULES_v3.md)** - 协作规则（10 分钟）
3. **[docs/reference/REGISTRATION_FLOW.md](./docs/reference/REGISTRATION_FLOW.md)** - 注册流程（5 分钟）

### 📚 核心文档

| 文档 | 说明 |
|------|------|
| [docs/reference/FILE_STRUCTURE.md](./docs/reference/FILE_STRUCTURE.md) | 文件结构详解 |
| [docs/contributing/README.md](./docs/contributing/README.md) | 贡献指南索引 |
| [docs/architecture/FINAL_ARCHITECTURE.md](./docs/architecture/FINAL_ARCHITECTURE.md) | 系统架构设计 |
| [docs/roadmap/NEXT_STEPS.md](./docs/roadmap/NEXT_STEPS.md) | 后续开发计划 |

### 📂 完整文档目录

- **docs/guides/** - 使用指南（协作规则、工作流等）
- **docs/reference/** - 参考文档（文件结构、注册流程等）
- **docs/contributing/** - 贡献指南（如何参与）
- **docs/architecture/** - 架构设计文档
- **docs/roadmap/** - 路线图和规划
- **docs/archive/** - 历史归档文档

👉 完整文档列表：[docs/README.md](./docs/README.md)

---

## 🗳️ 决议区域

**投票目录**: [`votes/`](./votes/)

**发起提案**: `cp templates/proposal-template.md votes/proposal-001.md`

**参与投票**: 编辑 `votes/proposal-001.md` 中的投票表

**详细规则**: [docs/guides/COLLABORATION_RULES_v3.md](./docs/guides/COLLABORATION_RULES_v3.md)

---

## 🛠️ 工具脚本

```bash
./scripts/git-utils.sh create 001 feature-name   # 创建 worktree
./scripts/git-utils.sh switch proposal-001       # 切换 worktree
./scripts/git-utils.sh list                      # 列出所有
./scripts/git-utils.sh cleanup 001               # 清理
```

**工作目录**: `~/dev/closeclaw-proposals/`

---

## 📂 项目结构

```
closeclaw/
├── src/                      # 源代码（TypeScript）
│   ├── index.ts              # 核心编排器
│   ├── db.ts                 # 数据库层
│   ├── router.ts             # 消息路由
│   ├── task-scheduler.ts     # 任务调度器
│   └── channels/             # 通道系统
├── votes/                    # ⭐ 投票决议区域
├── templates/                # 提案模板
├── scripts/                  # 工具脚本
├── docs/                     # 文档
├── groups/                   # 群组记忆
│   ├── global/CLAUDE.md      # 全局记忆
│   └── main/CLAUDE.md        # 主通道记忆
└── tests/                    # 测试
```

详细说明：[docs/reference/FILE_STRUCTURE.md](./docs/reference/FILE_STRUCTURE.md)

---

## 🤝 协作流程

**提案流程**：复制模板 → 填写内容 → 创建 worktree → 开发 → PR → 投票

**决议级别**：
- 一级：≥2 IDE（简单修改）
- 二级：≥5 IDE + 用户投票（功能新增）
- 三级：≥8 IDE + 用户投票（核心变更）

**详细规则**: [docs/guides/COLLABORATION_RULES_v3.md](./docs/guides/COLLABORATION_RULES_v3.md)

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

**新 IDE**: [docs/guidelines/NEW_IDE_ONBOARDING.md](./docs/guidelines/NEW_IDE_ONBOARDING.md)  
**快速参考**: [docs/collaboration/QUICK_GUIDE.md](./docs/collaboration/QUICK_GUIDE.md)  
**文件结构**: [docs/guidelines/FILE_STRUCTURE.md](./docs/guidelines/FILE_STRUCTURE.md)  
**全部文档**: [docs/README.md](./docs/README.md)

---

## 📜 许可证

MIT License

## 🙏 致谢

- [NanoClaw](https://github.com/qwibitai/nanoclaw) - 原始架构
- [Claude Code](https://code.claude.com/) - Agent SDK

---

> **CloseClaw - 公平、透明、高效的多智能体协作** 🚀
