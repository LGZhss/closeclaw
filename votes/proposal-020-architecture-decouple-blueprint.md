# 架构解耦与分层重构蓝图

> **提案 ID**: 020
> **提案级别**: 三级（核心架构/重大变更）
> **发起者**: Zed
> **发起日期**: 2026-03-17
> **状态**: 🟡 投票中

---

## 📋 提案背景

经过对现有代码库的全面分析，识别出以下核心问题：

### 🔴 运行时 Bug（当前版本无法正常工作）

| # | 问题 | 位置 | 影响 |
|---|------|------|------|
| B1 | `getRouterState` 调用但未 import | `src/router.ts:88` | 运行时 ReferenceError |
| B2 | Group-JID 映射错误 | `src/index.ts:138` | 消息永远无法路由到正确 group |
| B3 | 依赖 `chokidar` 但未安装 | `src/ipc.ts:3` | 模块加载即崩溃 |
| B4 | `src/utils/` 目录不存在 | `core/*.js`, `adapters/*.js` | 所有 core 模块加载即崩溃 |

### 🟡 结构性耦合问题

| # | 问题 | 说明 |
|---|------|------|
| C1 | 双重 Config 系统 | `src/config.ts` 与 `src/config/config.js` 并存且互相矛盾 |
| C2 | `src/core/` 是孤岛 | dispatcher/voter/agentRegistry 从未被 `index.ts` 调用 |
| C3 | Agent 执行层断链 | `processGroup` 和 `executeScheduledTask` 均为 TODO 存根 |
| C4 | JS/TS 混用 | `src/core/*.js`、`src/adapters/*.js` 无类型约束 |
| C5 | 容器残留污染 | `ContainerConfig` 类型、`container_config` DB 字段、`CONTAINER_*` 常量仍存在 |
| C6 | 协作主体注册双轨 | 运行时 `AgentRegistry`（内存）与 `.subjects.json`（文件）互不感知 |
| C7 | `GroupQueue` 语义错误 | 变量名 `activeContainers` 含义已过时 |

### ✅ 设计良好、保留的部分

- `Channel` 接口抽象（工厂模式注册）
- `db.ts` WAL 模式 + 复合索引优化
- `task-scheduler.ts` 三种调度类型
- `SubjectAdapter` 抽象类（为 API 化预留）
- `SandboxManager` 进程→Worker 降级策略

---

## 🎯 设计决策（已与用户确认）

| 问题 | 决策 |
|------|------|
| 运行时与协作框架是否分仓库？ | **是**，最终拆分为 `closeclaw-collab` + `closeclaw-runtime` |
| Agent 执行方式？ | **Sandbox**（子进程隔离 + Worker Threads 降级） |
| `src/core/` JS 孤岛命运？ | **废弃**，相关逻辑迁移至 TypeScript 并重写 |
| IPC 模块去留？ | **保留**，用于 agent-runner 容器内通信（`writeMessageToIPC()`） |
| 优先级？ | 现有 TS 代码稳定运行 → 关键路径打通 → 迁移代码补全测试 |
| Channel 实现？ | **Telegram**（Bot 凭据已在 env，优先实现） |

---

## 🏗️ 目标架构

### 分层模型（重构后）

```
┌──────────────────────────────────────────────────────┐
│                  入口层 (index.ts)                    │
│         仅负责组装与生命周期管理，不含业务逻辑         │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│               通道层 (src/channels/)                  │
│   Channel 接口 + 注册表 + Telegram 实现               │
│   职责：消息收发，不感知业务逻辑                       │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│              路由层 (src/router.ts)                   │
│   触发词匹配、消息格式化、group-JID 映射               │
│   职责：决定"谁处理"，不决定"怎么处理"                 │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│             Agent 执行层 (src/agent/)  【新增】        │
│   AgentRunner 接口 + SandboxExecutor + PromptBuilder  │
│   职责：构建 prompt，通过 Sandbox 执行，返回结果        │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│           模型适配层 (src/adapters/)  【迁移至 TS】    │
│   ILLMAdapter 接口 + OpenAI/Claude/Gemini 实现        │
│   + AdapterRegistry（与 ChannelRegistry 同构）        │
│   职责：统一 LLM 调用接口，隐藏各 API 差异             │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│            沙盒层 (src/sandbox/)  【迁移至 TS】        │
│   SandboxManager + ProcessExecutor + WorkerExecutor   │
│   职责：进程级隔离，多级降级                           │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│            IPC 层 (src/ipc/)  【清理保留】             │
│   文件系统 IPC，agent-runner 容器内写入 / 主进程读取   │
│   移除 chokidar，统一使用 fs.promises                  │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│         调度层 (src/scheduler/)  【重命名】            │
│   TaskScheduler，cron/interval/once 三种调度           │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│          持久化层 (src/db/)  【模块化拆分】            │
│   messages.ts / groups.ts / tasks.ts / sessions.ts    │
│   schema.ts（DDL + 初始化）                           │
└──────────────────────────────────────────────────────┘
```

### 目标目录结构

```
src/
├── index.ts                  # 纯组装：channels + scheduler + message loop
├── types.ts                  # 清理 ContainerConfig/MountConfig 残留
├── config.ts                 # 统一唯一 config（删除 src/config/config.js）
├── logger.ts                 # 不变
│
├── channels/
│   ├── registry.ts           # 不变
│   ├── index.ts              # 不变
│   └── telegram.ts           # 【新增】Telegram Bot 实现
│
├── router.ts                 # 修复 B1/B2，提取 PromptBuilder 至 agent/
│
├── agent/                    # 【新增模块，替代 core/ 孤岛】
│   ├── runner.ts             # IAgentRunner 接口
│   ├── sandbox-runner.ts     # 基于 Sandbox 的实现（用户选择 B）
│   └── prompt-builder.ts     # 从 router.ts 提取
│
├── adapters/                 # 全量迁移至 TypeScript
│   ├── base.ts               # ILLMAdapter 接口（替代 base.js）
│   ├── registry.ts           # 【新增】AdapterRegistry（同构于 ChannelRegistry）
│   ├── openai.ts             # 迁移自 openai.js，补全类型
│   ├── claude.ts             # 迁移自 claude.js，补全类型
│   ├── gemini.ts             # 迁移自 gemini.js，补全类型
│   └── subject-adapter.ts    # 不变（已是 TS）
│
├── sandbox/                  # 迁移至 TypeScript
│   ├── manager.ts            # 迁移自 sandboxManager.js
│   └── process-executor.ts   # 迁移自 processExecutor.js
│
├── ipc/
│   └── index.ts              # 清理：移除 chokidar，保留 fs.promises 实现
│
├── scheduler/
│   └── index.ts              # 重命名自 task-scheduler.ts（无逻辑变化）
│
└── db/
    ├── index.ts              # 重新导出所有操作
    ├── schema.ts             # DDL + initializeDatabase()
    ├── messages.ts           # insertMessage / getUnprocessedMessages / ...
    ├── groups.ts             # setRegisteredGroup / getRegisteredGroup / ...
    ├── tasks.ts              # insertTask / getDueTasks / ...
    └── sessions.ts           # setSession / getSession / setRouterState / ...
```

### 长期仓库拆分

待代码稳定后，按以下边界拆分：

```
closeclaw/                    （当前仓库 → 协作协议层）
├── votes/
├── docs/
├── .subjects.json
├── RULES.md
└── （无 src/，无 node_modules）

closeclaw-runtime/            （新仓库 → Agent Harness）
├── src/                      （以上所有 src/ 内容）
├── tests/
├── package.json
└── （可独立运行）
```

---

## 📦 实施路线（四阶段）

### Phase 0 — 关键 Bug 修复 ✦ 一级决议
> 目标：让现有 TS 代码能稳定运行

| 任务 | 文件 | 说明 |
|------|------|------|
| 修复 B1 | `src/router.ts` | 补充 `getRouterState` import |
| 修复 B2 | `src/index.ts` | 实现正确的 JID→groupFolder 查找函数 |
| 修复 B3 | `src/ipc.ts` | 移除 chokidar，改为轮询或 fs.watch |
| 清理 C5 | `src/types.ts` | 删除 `ContainerConfig`、`MountConfig` |
| 清理 C5 | `src/config.ts` | 删除 `CONTAINER_IMAGE` 等死常量 |
| 清理 C5 | `src/db.ts` | 删除 `container_config` schema 字段 |
| 修复 C7 | `src/group-queue.ts` | `activeContainers` → `activeAgents` |

**测试要求**：Phase 0 完成后，`npm test` 全部通过；`npm run typecheck` 零错误。

---

### Phase 1 — Agent 执行链路打通 ✦ 二级决议
> 目标：消息可以触发 LLM 并返回响应

| 任务 | 说明 |
|------|------|
| 新增 `src/agent/runner.ts` | 定义 `IAgentRunner` 接口 |
| 新增 `src/agent/sandbox-runner.ts` | 通过 `SandboxManager` 执行 prompt |
| 新增 `src/adapters/registry.ts` | `AdapterRegistry`，与 `ChannelRegistry` 同构 |
| 新增 `src/adapters/base.ts` | 将 `base.js` 迁移为带类型的 TS 接口 |
| 迁移 `src/adapters/openai.ts` | 从 `openai.js` 迁移，补全 `ILLMAdapter` 类型 |
| 修改 `src/index.ts` | 将 `executeScheduledTask` 和 `processGroup` TODO 替换为 `AgentRunner` 调用 |
| 统一 Config | 删除 `src/config/config.js`，将所需常量合并入 `src/config.ts` |

**测试要求**：
- `AgentRunner` 单元测试（mock SandboxManager）
- `AdapterRegistry` 单元测试
- `OpenAIAdapter` 集成测试（需 env 配置）
- 端到端：发送触发词 → 收到 LLM 响应

---

### Phase 2 — Telegram Channel ✦ 一级决议
> 目标：通过 Telegram Bot 收发消息

| 任务 | 说明 |
|------|------|
| 新增 `src/channels/telegram.ts` | 实现 `Channel` 接口，使用 `TELEGRAM_BOT_TOKEN` env |
| 注册至 `src/channels/index.ts` | 与现有注册表集成 |
| 消息格式化 | 适配 Telegram Markdown 格式 |

**测试要求**：
- Channel 接口契约测试（mock API）
- 本地 Bot 联调测试

---

### Phase 3 — TS 全量迁移与模块化 ✦ 二级决议
> 目标：消灭 JS/TS 混用，db.ts 模块化

| 任务 | 说明 |
|------|------|
| 迁移 `src/adapters/claude.ts` | 补全类型 |
| 迁移 `src/adapters/gemini.ts` | 补全类型 |
| 迁移 `src/sandbox/*.ts` | `SandboxManager` + `ProcessExecutor` |
| 废弃 `src/core/` | 删除所有 JS 孤岛文件 |
| 拆分 `src/db.ts` | 按 `src/db/` 结构模块化 |
| 重命名 `src/scheduler/` | `task-scheduler.ts` → `scheduler/index.ts` |

**测试要求**：
- 每个迁移模块需有对应单元测试
- 整体覆盖率 ≥ 70%（向 M6 目标 80% 推进）

---

### Phase 4 — 仓库拆分 ✦ 三级决议（本提案的最终目标）
> 目标：`closeclaw`（协作协议）与 `closeclaw-runtime`（Agent Harness）解耦

**前提条件**：Phase 0–3 全部完成，测试覆盖率达标。

| 任务 | 说明 |
|------|------|
| 创建 `closeclaw-runtime` 仓库 | 从当前仓库提取 `src/`、`tests/`、`package.json` |
| 当前仓库清理 | 删除 `src/`、`dist/`、`node_modules/`、`package.json` |
| 文档更新 | `docs/` 中更新架构说明，指向新仓库 |
| CI/CD 分离 | 各仓库独立 GitHub Actions |
| 协作主体注册更新 | `.subjects.json` 增加 `runtime_repo` 字段 |

---

## ⚠️ 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| Phase 0 修复引入回归 | 低 | 修复前后均运行 `npm test` |
| Phase 1 adapter 迁移破坏 API 兼容 | 中 | 保持 `chat()` 方法签名不变 |
| Phase 3 db.ts 拆分影响查询性能 | 低 | 保持同一 `db` 实例，只做函数分组 |
| Phase 4 仓库拆分历史丢失 | 中 | 使用 `git subtree split` 保留 git log |
| IPC 模块 chokidar 移除影响实时性 | 低 | fs.watch 原生 API 满足需求，轮询作为降级 |

---

## 🗳️ 协作主体投票

| 协作主体 | 态度 | 得分 | 技术理由 |
| :--- | :--- | :--- | :--- |
| Zed | ✅ 赞同 | +1 | 发起者。当前架构存在多处运行时崩溃点，分阶段修复是必要的。四阶段路线保证了渐进式演进，不破坏现有协作流程。仓库拆分推迟到代码稳定后进行，降低了整体风险。 |

---

> **最终决议**: 🟡 投票中
>
> 三级决议需 ≥ 8 个协作主体参与 + 用户投票。
> 本提案描述的是长期方向蓝图；各实施阶段（Phase 0–3）将作为独立的一级/二级提案单独发起和投票。