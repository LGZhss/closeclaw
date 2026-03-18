# CloseClaw 最终架构文档

> **项目名称**: CloseClaw
> **版本**: 2.1.0
> **创建日期**: 2026-03-13
> **最后更新**: 2026-03-17
> **状态**: 🟢 就绪

***

## 🧠 核心理念：Harness Engineering（环境工程）

基于 **Harness Engineering** 理念：

- **模型即智能体** - 模型本身就是智能体
- **构建 Harness** - 提供环境、工具、知识、边界
- **API 化演进** - 从手动轮换到 API 调度的多智能体架构

> Harness = Tools + Knowledge + Observation + Action Interfaces + Permissions

***

## 📋 概述

**CloseClaw** 是一个基于 Node.js 的本地 AI 协同调度 Harness，由原 lgzhssagent 重构而来。核心特点是：

- **Harness 优先** - 专注于构建环境和工具，信任模型的智能
- **投票与仲裁机制** - 简单清晰的决策规则
- **沙盒隔离安全** - 进程级隔离，多级降级策略
- **API 化架构** - 支持从手动轮换向 API 调度演进

***

## 🏗️ 系统架构

### 核心分层

```
┌─────────────────────────────────────────────────────────────┐
│                    用户交互层 (Interaction)                 │
│              (CLI / 本地 IDE 集成 / 外部通道)               │
│              - src/router.ts (API 路由)                      │
│              - src/channels/ (Telegram/etc 通道)            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    任务调度层 (Scheduling)                   │
│              - src/task-scheduler.ts (任务队列)              │
│              - src/group-queue.ts (群组队列)                 │
│              - src/dispatcher.js (任务分发)                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    多智能体协调层 (Coordination)             │
│              - src/core/agentRegistry.js (注册管理)          │
│              - src/core/voter.js (投票引擎)                  │
│              - src/core/arbitrator.js (仲裁)                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    执行与沙盒层 (Execution)                  │
│              - src/sandbox/ (隔离环境管理)                   │
│              - src/container-runner.ts (容器执行)            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    工具与模型层 (Tools & Models)             │
│              - src/tools/ (统一工具抽象)                     │
│              - src/adapters/ (12+ LLM 适配器)               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    数据与持久化层 (Persistence)               │
│              - src/db.ts (SQLite/SQLiteCloud)                │
│              - src/core/session.js (活跃会话)                │
└─────────────────────────────────────────────────────────────┘
```

***

## 🧩 核心模块详解

### 1. 通讯与路由 (Channels & Routing)
- **src/channels/**: 实现与外部平台（如 Telegram）的交互。
- **src/router.ts**: 核心业务路由，处理任务接收、分发及反馈结果。

### 2. 任务调度 (Scheduling)
- **src/task-scheduler.ts**: 管理并发任务，确保系统稳定性。
- **src/dispatcher.js**: 负责将具体指令路由到对应的处理模块。

### 3. 多智能体协调 (Coordination)
- **src/core/agentRegistry.js**: 协作主体管理与追踪。
- **src/core/voter.js**: 核心投票引擎，支持三级决议制度。
- **src/core/arbitrator.js**: 自动处理投票争议及特殊权限决策。

### 4. 沙盒与容器 (Sandbox & Containers)
- **src/sandbox/**: 进程级隔离，防止代码执行影响主机安全。
- **src/container-runner.ts**: 实现容器化执行环境。

### 5. 模型适配器 (Adapters)
- **src/adapters/**: 支持 OpenAI, Claude, Gemini, 硅基流动等多种主流模型。
- **subject-adapter.ts**: 专门处理协作主体与特定模型的绑定关系。

***

## 📊 投票统计

所有投票数据保存在 `votes/` 目录下。

> **详细投票规则请参考** **[RULES.md](../../RULES.md)。**

***

## 🔄 工作流程

### 代码修改流程

```
1. 提出修改提案
   ↓
2. 必须提供源码或git分支
   ↓
3. 确定决议级别（一级/二级/三级）
   ↓
4. 发起投票
   ↓
5. 协作主体投票（赞成+1 / 弃权0 / 反对-1）
   ↓
6. 用户投票（二级及以上必须参与）
   ↓
7. 计算得分并检查通过条件
   ↓
8. 通过 → 执行修改
   不通过 → 放弃或重新提案
```

> 详细规则见 [RULES.md](../../RULES.md)

***

## 📁 项目结构

```
.closeclaw/
├── src/
│   ├── index.ts                # 入口文件
│   ├── core/                   # 核心协作逻辑 (.js)
│   ├── adapters/               # 模型适配器 (混合 JS/TS)
│   ├── channels/               # 外部通讯通道 (.ts)
│   ├── sandbox/                # 沙盒执行环境 (.js)
│   ├── tools/                  # 工具管理 (.js)
│   ├── router.ts               # 路由分发 (.ts)
│   ├── task-scheduler.ts       # 任务调度 (.ts)
│   └── db.ts                   # 数据库持久化 (.ts)
├── docs/                       # 结构化文档中心
├── votes/                      # 提案与投票记录
└── worktrees/                  # 并行任务工作树
```

***

## 🎯 实施优先级

### P1 前期（0-2 周）

1. ✅ Agent Registry
2. ✅ Voting Engine
3. ✅ 进程级沙盒

### P1 中期（2-4 周）

1. ✅ Arbitrator
2. ✅ Worker Threads 沙盒
3. ✅ 单元测试覆盖

### P1 后期（4-6周）

1. ⏳ isolated-vm POC
2. ⏳ 集成测试
3. ⏳ 性能监控
4. ⏳ 灰度发布

***

## 🔗 相关文档

- [协作规则 v3.1](../../RULES.md) ⭐⭐⭐
- [架构概览](../05-architecture/overview.md)
- [协作主体协作机制引导](../03-development/onboarding.md)
- [环境拓扑与进度提取](../02-collaboration/environment.md)
- [新协作主体注册流程](../04-reference/registration-flow.md)
- [规划任务](../07-roadmap/tasks.md)

***

## 📝 注意事项

1. **代码修改先投票** - 严禁直接修改代码
2. **模型信息必须收集** - 每次协作主体注册/更新时询问
3. **权重固定** - 用户±0.5，协作主体±1
4. **三级法定人数** - 一级≥2，二级≥3，三级≥5
5. **沙盒进程优先** - isolated-vm 作为二期

***

\> **CloseClaw - 公平、透明、高效的多智能体协作**
\> **架构就绪，可以开始实施！** 🚀
