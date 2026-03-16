# CloseClaw 全局记忆中心 (Global Memory)

> **本文件职责**: 运行时状态记忆——当前架构决策、活跃提案、开发规范。
> 协作主体注册信息已迁移至 [`docs/collaborators/registry.md`](../../docs/collaborators/registry.md)，本文件不再维护主体列表。
>
> **编辑规范**: PowerShell 操作必须显式指定 `-Encoding UTF8`，严防乱码。

CloseClaw 是一个基于 NanoClaw 架构的个人 AI 助手，采用容器隔离技术，支持多通道通信和定时任务调度。

## 核心架构

### 技术栈

- **运行时**: Node.js 20+
- **语言**: TypeScript (ESM)
- **数据库**: SQLite (better-sqlite3)
- **日志**: Pino

### 核心模块

1. **编排器** (`src/index.ts`)
   - 单进程架构
   - 通道自注册
   - 消息轮询循环
   - Agent 调用

2. **通道系统** (`src/channels/`)
   - 工厂模式注册
   - 自注册机制
   - 支持 Telegram、WhatsApp 等

3. **数据库层** (`src/db.ts`)
   - SQLite 存储
   - 消息、群组、任务、会话管理
   - WAL 模式并发

4. **路由系统** (`src/router.ts`)
   - 消息格式化
   - 触发词匹配
   - 响应发送

5. **容器运行器** (`src/container-runner.ts`)
   - Docker 容器执行
   - 文件系统隔离
   - 超时控制

6. **任务调度器** (`src/task-scheduler.ts`)
   - Cron 表达式支持
   - 周期性任务
   - 一次性任务

7. **IPC 系统** (`src/ipc.ts`)
   - 文件系统 IPC
   - 消息传递
   - 任务结果回传

## 开发规范

### 代码风格

- 使用 TypeScript 严格模式
- ESM 模块系统
- 异步函数使用 async/await
- 错误处理使用 try-catch
- 日志使用 logger 模块

### 文件命名

- TypeScript 文件：`.ts`
- 测试文件：`*.test.ts`
- 配置文件：小写，如 `tsconfig.json`

### 提交规范

- 功能：`feat: 添加 XX 功能`
- 修复：`fix: 修复 XX 问题`
- 文档：`docs: 更新 XX 文档`
- 重构：`refactor: 重构 XX 模块`

## 关键设计决策

### 1. 安全沙盒

所有 Agent 操作在隔离环境中执行，提供：
- 文件系统访问限制
- 进程级隔离
- 网络访问控制（可选）

### 2. 分层记忆

```
groups/global/CONTEXT.md    # 全局记忆（所有组可读）
groups/{name}/CONTEXT.md    # 组记忆（仅该组可写）
```

### 3. 触发词机制

默认触发词：`@CloseClaw`
- 大小写不敏感
- 必须在消息开头
- 可通过环境变量修改

### 4. 消息流程

```
通道接收 → SQLite 存储 → 轮询检测 → 触发匹配 → 
容器执行 → 响应格式化 → 通道发送
```

## 安全考虑

### 容器安全

- 非 root 用户（uid 1000）
- 只读挂载（可选）
- 资源限制（超时）
- 文件系统隔离

### 数据安全

- `.env` 文件不提交
- 会话数据隔离
- 群组数据独立

## 测试策略

### 单元测试

- 配置测试：`tests/config.test.ts`
- 数据库测试：`tests/db.test.ts`
- 路由测试：`tests/router.test.ts`

### 运行测试

```bash
npm test
npm run test:watch
```

## 部署

### 开发环境

```bash
npm run setup
npm run dev
```

### 生产环境

```bash
npm run build
npm start
```

## 故障排查

### 常见问题

1. **进程启动失败**
   - 检查 Node.js 版本 (需要 >=20)
   - 验证依赖是否安装

CloseClaw 是一个基于容器隔离技术的 AI 协作系统，支持多通道通信和异步决议驱动开发。

---

## 2. 核心架构 (Topology)

| 层级 | 模块 | 路径 |
| :--- | :--- | :--- |
| 编排器 | 消息轮询与任务调度 | `src/index.ts` |
| 通道系统 | 多平台适配器（Telegram/WhatsApp/WeChat） | `src/channels/` |
| 数据库层 | SQLite 持久化（better-sqlite3） | `src/db.ts` |
| 容器运行器 | 隔离执行环境（Docker 可选） | `src/container-runner.ts` |
| 配置 | 环境变量与常量 | `src/config.ts` |
| 日志 | Pino 结构化日志 | `src/logger.ts` |

**技术栈**: Node.js 20+ · TypeScript (ESM) · SQLite · Docker（可选） · Vitest

---

## 3. 分层记忆模型 (Memory Layers)

| 层级 | 位置 | 用途 |
| :--- | :--- | :--- |
| 全局记忆 | `groups/global/CONTEXT.md`（本文件） | 架构、规范、提案状态 |
| 主体注册 | `docs/collaborators/registry.md` | 所有协作主体与模型列表 |
| 阶段记忆 | `task.md` / `walkthrough.md` | 当前任务进度 |
| 本地记忆 | 各主体 Session 内部 | 短期上下文 |

---

## 4. 协作规范

- [NanoClaw 原始项目](https://github.com/qwibitai/nanoclaw)
- [SQLite 文档](https://www.sqlite.org/docs.html)

---

> **最后更新**: 2026-03-16 - 项目清理与文档统一化
