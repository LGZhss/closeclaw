# CloseClaw 项目上下文

## 项目概述

CloseClaw 是一个基于 NanoClaw 架构的个人 AI 助手，采用容器隔离技术，支持多通道通信和定时任务调度。

## 核心架构

### 技术栈

- **运行时**: Node.js 20+
- **语言**: TypeScript (ESM)
- **数据库**: SQLite (better-sqlite3)
- **容器**: Docker
- **Agent**: Claude Code CLI
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

### 1. 容器隔离

所有 Agent 在独立容器中运行，提供：
- 文件系统隔离
- 进程隔离
- 网络隔离（可选）
- 非 root 用户执行

### 2. 分层记忆

```
groups/global/CLAUDE.md    # 全局记忆（所有组可读）
groups/{name}/CLAUDE.md    # 组记忆（仅该组可写）
```

### 3. 触发词机制

默认触发词：`@Andy`
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

### macOS 服务

使用 launchd 运行（参考 NanoClaw）

## 故障排查

### 常见问题

1. **容器启动失败**
   - 检查 Docker 是否运行
   - 验证镜像是否构建

2. **通道未连接**
   - 检查 API 密钥配置
   - 查看日志输出

3. **任务不执行**
   - 验证 cron 表达式
   - 检查数据库状态

### 日志位置

- 主机日志：`logs/nanoclaw.log`
- 错误日志：`logs/nanoclaw.error.log`

## 扩展开发

### 添加通道

1. 创建 `src/channels/{name}.ts`
2. 实现 `Channel` 接口
3. 调用 `registerChannel()`
4. 添加到 `src/channels/index.ts`

### 添加技能

技能作为分支开发：
```bash
git checkout -b skill/{name}
# 实现技能代码
git push origin skill/{name}
```

## 参考资源

- [NanoClaw 原始项目](https://github.com/qwibitai/nanoclaw)
- [Claude Code 文档](https://code.claude.com/)
- [Docker 文档](https://docs.docker.com/)
- [SQLite 文档](https://www.sqlite.org/docs.html)
