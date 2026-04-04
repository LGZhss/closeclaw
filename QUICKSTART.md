# CloseClaw 快速开始指南

## 一键启动

1. **启动系统**：双击 `start.ps1`
2. **停止系统**：双击 `stop.ps1`

## 文件结构说明

### 核心文件（必需）
```
.env                    # 环境配置（API Keys、Telegram Token）
package.json            # Node.js 依赖配置
tsconfig.json           # TypeScript 配置
start.ps1              # 启动脚本 ⭐
stop.ps1               # 停止脚本 ⭐
```

### 核心目录（必需）
```
cmd/                    # Dart 控制平面（未来使用）
kernel/                 # Go 内核总线（状态管理、调度器）
src/                    # TypeScript 执行层（LLM 调用、沙盒执行）
proto/                  # gRPC 协议定义
tmp/                    # 编译输出（kernel.exe）
dist/                   # TypeScript 编译输出
```

### 开发相关目录
```
tests/                  # 测试文件
docs/                   # 文档
scripts/                # 工具脚本
.github/                # GitHub Actions CI/CD
```

### IDE 协作目录（可选，用于多 IDE 协作）
```
.arts/                  # Arts IDE
.claude/                # Claude Code
.comate/                # Comate
.dropstone/             # Dropstone
.gemini/                # Gemini
.joycode/               # JoyCode
.kiro/                  # Kiro（当前使用）
.lingma/                # Lingma
.qoder/                 # Qoder
.verdent/               # Verdent
.workbuddy/             # WorkBuddy
```

### 治理相关目录
```
votes/                  # 提案投票
.subjects.json          # 协作主体注册表
RULES.md                # 治理规则
AGENTS.md               # 开发指南
```

### 可以删除的目录（如果不需要）
```
coverage/               # 测试覆盖率报告
archive/                # 归档文件
bin/                    # 旧的二进制文件
config/                 # 旧的配置文件
data/                   # 运行时数据（会自动创建）
```

## 系统架构

CloseClaw 采用三语言微内核架构：

1. **Dart 控制平面**（未来）：生命周期管理、MCP Server
2. **Go 状态总线**：高性能 SQLite、任务调度、消息路由
3. **TypeScript 执行层**：LLM SDK 调用、沙盒执行

## 配置说明

### 必需配置（.env 文件）

```env
# LLM API Keys（至少配置一个）
OPENROUTER_API_KEY=sk-or-v1-...
GEMINI_API_KEY=AIza...
ZHIPU_API_KEY=...

# Telegram Bot（如果使用 Telegram）
TELEGRAM_TOKEN=...
ALLOWED_USER_IDS=...

# 系统配置
ASSISTANT_NAME=CloseClaw
WORKSPACE_DIR=E:\.closeclaw\data
```

## 常见问题

### Q: 启动失败怎么办？
A: 检查以下几点：
1. 是否安装了 Node.js 20+ 和 Go 1.21+
2. 是否配置了 .env 文件
3. 是否运行了 `npm install`

### Q: 如何查看日志？
A: 启动后会打开两个窗口，分别显示 Go 内核和 TypeScript 执行器的日志。

### Q: 如何更新代码？
A: 
1. 停止系统：`.\stop.ps1`
2. 拉取最新代码：`git pull`
3. 重新启动：`.\start.ps1`

### Q: 这么多 IDE 目录是干什么的？
A: CloseClaw 支持多 IDE 协作开发，每个 IDE 有自己的配置目录。如果你只用一个 IDE，其他目录可以忽略（但建议保留，因为它们包含了协作历史）。

## 技术支持

- 文档：`docs/01-getting-started/README.md`
- 开发指南：`AGENTS.md`
- 治理规则：`RULES.md`
