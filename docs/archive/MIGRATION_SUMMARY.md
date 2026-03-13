# CloseClaw 项目迁移总结

## 项目概述

CloseClaw 是基于 [NanoClaw](https://github.com/qwibitai/nanoclaw) 架构构建的个人 AI 助手，已针对中国用户进行了优化。项目采用 TypeScript 重写，支持多通道通信、容器隔离、任务调度等功能。

## 迁移完成情况

### ✅ 已完成的核心模块

#### 1. 基础配置
- [x] `package.json` - TypeScript 项目配置，依赖管理
- [x] `tsconfig.json` - TypeScript 编译配置
- [x] `.env.example` - 环境变量模板
- [x] `.gitignore` - Git 忽略规则
- [x] `vitest.config.ts` - 测试配置

#### 2. 核心源代码（TypeScript）
- [x] `src/index.ts` - 核心编排器（消息轮询、Agent 调用）
- [x] `src/config.ts` - 配置常量
- [x] `src/types.ts` - TypeScript 类型定义
- [x] `src/logger.ts` - Pino 日志模块
- [x] `src/db.ts` - SQLite 数据库层（better-sqlite3）
- [x] `src/router.ts` - 消息路由和格式化
- [x] `src/group-queue.ts` - 组队列管理（并发控制）
- [x] `src/ipc.ts` - 文件系统 IPC 通信
- [x] `src/container-runner.ts` - Docker 容器运行器
- [x] `src/task-scheduler.ts` - 任务调度器（cron 支持）

#### 3. 通道系统
- [x] `src/channels/registry.ts` - 通道工厂注册表
- [x] `src/channels/index.ts` - 通道自注册入口

#### 4. 容器配置
- [x] `container/Dockerfile` - 容器镜像定义
- [x] `container/build.sh` - 容器构建脚本
- [x] `container/agent-runner/package.json` - Agent 运行器配置
- [x] `container/agent-runner/tsconfig.json` - Agent 编译配置
- [x] `container/agent-runner/src/index.ts` - 容器内入口

#### 5. 设置脚本
- [x] `setup/index.ts` - 安装向导（环境检查、依赖安装）

#### 6. 测试
- [x] `tests/config.test.ts` - 配置测试
- [x] `vitest.config.ts` - 测试配置

#### 7. 文档
- [x] `README.md` - 项目说明和使用指南
- [x] `groups/global/CLAUDE.md` - 全局记忆文件
- [x] `groups/main/CLAUDE.md` - 主通道记忆文件

## 项目结构

```
closeclaw/
├── src/                          # TypeScript 源代码
│   ├── index.ts                  ⭐ 核心编排器
│   ├── config.ts                 ⭐ 配置常量
│   ├── types.ts                  ⭐ 类型定义
│   ├── logger.ts                 ⭐ 日志模块
│   ├── db.ts                     ⭐ 数据库层
│   ├── router.ts                 ⭐ 消息路由
│   ├── group-queue.ts            ⭐ 并发控制
│   ├── ipc.ts                    ⭐ IPC 通信
│   ├── container-runner.ts       ⭐ 容器运行
│   ├── task-scheduler.ts         ⭐ 任务调度
│   └── channels/                 ⭐ 通道系统
│       ├── registry.ts
│       └── index.ts
│
├── container/                    # 容器配置
│   ├── Dockerfile
│   ├── build.sh
│   └── agent-runner/
│       ├── src/index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── setup/                        # 设置脚本
│   └── index.ts
│
├── tests/                        # 测试文件
│   └── config.test.ts
│
├── groups/                       # 群组记忆
│   ├── global/CLAUDE.md
│   └── main/CLAUDE.md
│
├── .env.example                  # 环境变量模板
├── .gitignore                    # Git 忽略
├── package.json                  # 依赖配置
├── tsconfig.json                 # TS 配置
├── vitest.config.ts              # 测试配置
└── README.md                     # 项目文档
```

## 核心特性

### 1. 微内核架构
- 单进程编排器
- 通道自注册模式
- 插件化扩展

### 2. 容器隔离
- Docker 容器执行 Agent
- 文件系统隔离
- 非 root 用户运行
- 资源限制（超时控制）

### 3. 多通道支持
- Telegram（待实现）
- WhatsApp（待实现）
- Slack（待实现）
- Discord（待实现）
- 通过技能系统添加

### 4. 分层记忆
- `groups/global/CLAUDE.md` - 全局共享记忆
- `groups/{name}/CLAUDE.md` - 群组独立记忆
- 基于 CLAUDE.md 的上下文加载

### 5. 任务调度
- Cron 表达式支持
- 周期性任务
- 一次性任务
- 任务日志记录

### 6. 并发控制
- 全局并发限制
- 组队列管理
- 消息轮询

## 技术栈

| 组件 | 技术 | 用途 |
|------|------|------|
| 运行时 | Node.js 20+ | JavaScript 运行时 |
| 语言 | TypeScript 5.7 | 类型安全的 JavaScript |
| 数据库 | better-sqlite3 | SQLite 同步绑定 |
| 日志 | pino | 高性能日志库 |
| 容器 | Docker | 进程隔离 |
| Agent | Claude Code CLI | AI Agent 执行 |
| 调度 | cron-parser | Cron 表达式解析 |
| 测试 | vitest | 单元测试框架 |

## 使用方法

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境

复制 `.env.example` 到 `.env` 并填写 API 密钥：

```bash
cp .env.example .env
# 编辑 .env 添加 ANTHROPIC_API_KEY
```

### 3. 构建容器

```bash
bash container/build.sh
```

### 4. 启动应用

```bash
npm start
```

或开发模式：

```bash
npm run dev
```

## 待完成功能

### 通道实现
- [ ] Telegram 通道
- [ ] WhatsApp 通道
- [ ] Slack 通道
- [ ] Discord 通道
- [ ] Gmail 集成

### 技能系统
- [ ] /add-telegram 技能
- [ ] /add-whatsapp 技能
- [ ] /add-slack 技能
- [ ] /customize 技能
- [ ] /debug 技能

### 增强功能
- [ ] Apple Container 支持（macOS）
- [ ] MCP 服务器集成
- [ ] 浏览器自动化
- [ ] 语音转写
- [ ] 图片识别

## 与 NanoClaw 的对比

| 特性 | NanoClaw | CloseClaw |
|------|----------|-----------|
| 语言 | TypeScript | TypeScript |
| 架构 | 单进程编排 | 单进程编排 |
| 容器 | Docker/Apple Container | Docker |
| 通道 | 多通道（技能添加） | 多通道（待实现） |
| 记忆 | CLAUDE.md | CLAUDE.md |
| 调度 | cron 支持 | cron 支持 |
| 本地化 | 英文 | 中文优化 |

## 下一步计划

### 短期（1-2 周）
1. 实现 Telegram 通道
2. 完善错误处理
3. 添加更多测试用例
4. 编写通道开发文档

### 中期（1 个月）
1. 实现 WhatsApp 通道
2. 添加技能系统
3. 实现 MCP 服务器
4. 优化容器启动速度

### 长期（3 个月）
1. 支持 Apple Container
2. 添加 Agent 集群功能
3. 实现 Web 界面
4. 支持更多 AI 模型

## 参考资料

- [NanoClaw GitHub](https://github.com/qwibitai/nanoclaw)
- [NanoClaw 文档](https://nanoclaw.dev)
- [Claude Code SDK](https://code.claude.com/docs)
- [Docker 文档](https://docs.docker.com/)

## 贡献指南

CloseClaw 采用技能系统扩展功能。贡献新通道或功能：

1. Fork 项目
2. 创建技能分支（如 `skill/telegram`）
3. 实现通道代码
4. 提交 PR

## 许可证

MIT License

---

**创建时间**: 2026-03-13  
**版本**: 1.0.0  
**状态**: 核心功能完成，通道待实现
