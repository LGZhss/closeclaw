# CloseClaw — 三语言异构微内核个人 AI 助手 (P028)

> [!IMPORTANT]
> **开发准则**: 进场前请务必深度阅读 [RULES.md](./RULES.md)。所有变更必须遵循“无提案、不代码”原则。

---

## 🚀 极简启动 (Minimalist Startup)

CloseClaw 已完成 P028 极简主义重构，根目录已极致降噪。请按以下步序进入：

### 1. 环境准备
- **Node.js**: v20+ (TS 沙盒执行)
- **Go**: v1.21+ (内核总线)
- **Dart**: v3.0+ (控制平面)

### 2. 快速起步
```bash
# 1. 安装 TS 沙盒依赖
npm install

# 2. 配置环境
cp .env.example .env
# 编辑 .env 填入 ANTHROPIC_API_KEY / TELEGRAM_TOKEN 等
```

### 3. 系统时区 (Timezone)
> [!NOTE]
> CloseClaw 默认使用 **东八区时间 (UTC+8/CST)** 进行消息格式化与调度。

### 4. 验证运行
```bash
# 查看内核日志，确认数据库与总线就绪
# 观察日志中的 [CST] 时间戳
tail -f data/logs/kernel.log (或查看控制台输出)
```

---

## 🏗️ 三语言架构 (The Micro-kernel Stack)

| 层次 | 层次名 | 语言 | 职责 |
| :--- | :--- | :--- | :--- |
| **控制平面** | Layer 1 | Dart | 生命周期管理、MCP 协议暴露、CLI 审计。 |
| **状态总线** | Layer 2 | Go | 高并发 SQLite WAL、RPC 任务分发、毫秒级调度。 |
| **执行沙盒** | Layer 3 | TS | 生态工具 (NPM) 调用、LLM 逻辑封装、stateless 执行。 |

---

## 📁 项目结构 (Filesystem Topology)

```bash
.closeclaw/
├── bin/                    # 编译后的原生二进制
├── cmd/                    # Dart 控制平面源码
├── kernel/                 # Go 核心代码与状态逻辑
├── src/                    # TS 沙盒执行层系统
├── data/                   # 唯一持久化中心 (SQLite, Groups 记忆, Logs)
│   ├── closeclaw.db        # SQLite 核心数据库
│   ├── groups/             # 分群组语境记忆 (CONTEXT.md)
│   └── logs/               # 系统运行日志中心
├── votes/                  # 协作提案决议区 (治理中心)
├── docs/                   # 深度文档体系
├── .subjects.json          # 协作主体注册表 (21+ Subjects)
└── RULES.md                # 核心治理规则 (法定人数 2/4/6)
```

---

## 🔧 开发指令

```bash
npm run dev          # 启动 TS 沙盒 (开发模式)
cd kernel && go run main.go  # 启动 Go 内核
npm test             # 运行核心单元测试
npm run format       # 代码格式化
```

---

## 🆘 需要帮助？

**协作手册**: [docs/README.md](./docs/README.md)  
**快速参考**: [RULES.md](./RULES.md)  
**架构详述**: [docs/05-architecture/overview.md](./docs/05-architecture/overview.md)  

---

## 📜 许可证

Apache License 2.0  
*CloseClaw - 极简、实时、确定的协作* 🚀
