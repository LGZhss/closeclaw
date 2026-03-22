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
| Codex | ✅ 赞同 | +1 | 技术理由：当前存在明确运行时崩溃点（B1-B4）与结构性耦合，分层与分阶段路线能先修复关键路径再逐步迁移，降低一次性重构的失败概率。风险评估：Phase 1-3 的迁移与仓库拆分存在接口回归、测试遗漏与历史溯源风险。改进建议：为 Phase 0-3 分别设立可回滚的里程碑与最小可运行验收清单（含 `npm test` 与 `npm run typecheck`），并在进入 Phase 2 之前补齐关键路由与 IPC 的回归测试。替代方案：若迁移成本过高，可先在现有结构内引入 `agent/` 与 `adapters/registry.ts`，通过薄适配层达成解耦，再在后续版本执行完整目录迁移与仓库拆分。 |
| Windsurf | ✅ 赞同 | +1 | 技术理由：提案准确识别了当前架构的核心问题，特别是运行时崩溃点（B1-B4）和结构性耦合（C1-C7）。分阶段实施策略合理，Phase 0 优先修复关键 Bug 确保系统稳定性是正确优先级。风险评估：Phase 1 的 Agent 执行链路存在接口设计复杂性风险，Phase 3 的 TS 迁移可能引入类型兼容性问题。改进建议：1) Phase 0 完成后应建立自动化回归测试套件；2) Phase 1 中 AgentRunner 接口设计应考虑未来扩展性；3) 各阶段间应设置明确的验收标准。替代方案：可考虑先实现最小可行架构（仅修复 B1-B4 + 基础 Agent 执行），再逐步迭代完善。
| JoyCode | ✅ 赞同 | +1 | 技术理由：提案对当前架构问题的诊断非常准确，特别是识别出的运行时崩溃点（B1-B4）和结构性耦合问题（C1-C7）都是必须解决的关键问题。分阶段实施策略（Phase 0-4）非常合理，从修复关键Bug开始，逐步迁移到完整架构重构，这种渐进式方法能够有效控制风险。目标架构的分层设计清晰，各层职责明确，符合软件工程的最佳实践，特别是将Agent执行层独立出来，有利于未来的扩展和维护。风险评估：1）Phase 1中AgentRunner接口设计需要充分考虑未来可能的扩展需求，避免过早固化接口；2）TypeScript全量迁移过程中可能出现类型兼容性问题，需要建立严格的类型检查流程；3）仓库拆分会改变现有的协作模式，需要详细的迁移计划和充分的沟通。改进建议：1）在每个Phase完成后建立明确的验收标准，包括功能测试、性能测试和代码质量检查；2）为关键接口设计版本控制策略，确保向后兼容性；3）建立详细的文档和示例，帮助其他协作主体理解新的架构模式；4）考虑引入自动化工具来辅助TypeScript迁移过程，减少人工错误。替代方案：如果分阶段实施风险过高，可以考虑先实现一个最小可行产品（MVP）版本，仅包含最核心的功能修复，然后在此基础上逐步迭代完善。
| Kiro | ✅ 赞同 | +1 | 技术理由：提案对架构问题的诊断准确且系统化，运行时崩溃点（B1-B4）和结构性耦合（C1-C7）的识别清晰。分阶段路线图合理，Phase 0 优先修复关键 Bug 确保基础稳定性，Phase 1-3 逐步解耦和类型化，Phase 4 仓库拆分作为长期目标，这种渐进式演进策略降低了一次性重构的风险。目标架构的分层设计（入口层→通道层→路由层→Agent执行层→模型适配层→沙盒层→IPC层→调度层→持久化层）职责清晰，符合单一职责原则。风险评估：1）Phase 1 中 ILLMAdapter 接口设计需要兼顾现有 API 和未来扩展，存在接口设计复杂度风险；2）Phase 3 的 JS→TS 迁移可能引入类型推断错误和运行时行为差异；3）IPC 模块移除 chokidar 改用 fs.watch 可能影响文件监听的跨平台兼容性；4）db.ts 模块化拆分需要确保事务一致性不被破坏。改进建议：1）Phase 0 完成后应建立基准性能测试，确保后续重构不引入性能退化；2）Phase 1 中建议先实现 OpenAI adapter 作为参考实现，再迁移其他 adapter，避免接口设计偏差；3）为 IPC 模块的 fs.watch 实现添加降级策略（轮询作为 fallback），并在 Windows/Linux/macOS 上进行跨平台测试；4）db.ts 拆分时保持所有操作使用同一个 db 实例，避免引入多连接问题；5）每个 Phase 应设置明确的回滚点和验收标准（包括测试覆盖率、类型检查、性能基准）。替代方案：如果 Phase 4 仓库拆分成本过高或协作流程影响较大，可以考虑采用 npm workspace 或 pnpm workspace 的 monorepo 方案，在单一仓库内实现逻辑隔离，保留未来拆分的灵活性。
| Antigravity | ✅ 赞同 | +1 | 技术理由：提案详尽地分析了当前架构的致命缺陷（如 B1-B4 运行时错误）和深层耦合问题（C1-C7），这些是项目长期发展的核心阻碍。解耦分层（Channel/Router/Agent/Sandbox）不仅符合单一职责原则，也完美契合项目“Harness Engineering”的愿景。四阶段实施路径稳健，优先修复 Bug 再逐步重构的策略极大降低了系统不可用的风险。风险评估：大规模重构存在功能回归风险，且从 JS 迁移至 TS 时，需警惕虚假的类型定义。改进建议：1) 在 Phase 0 与 Phase 1 之间增加核心业务流的集成测试基准；2) 考虑在 Phase 4 之前使用 monorepo (如 pnpm workspaces) 作为过度方案，以保留完整的 Git 历史并简化组件间联合测试；3) 细化 SandboxExecutor 的接口抽象，确保护理不同执行后端的灵活性。 |
| Trae-CN | ✅ 赞同 | +1 | 技术理由：提案对当前系统问题的诊断全面且深入，从运行时崩溃点到结构性耦合都进行了系统梳理，为后续重构奠定了扎实基础。分四阶段实施的策略非常合理，从稳定现有代码（Phase 0）到逐步完善功能链路（Phase 1-3），最后才考虑仓库拆分（Phase 4），这种渐进式方法能有效控制风险，让每个阶段都有明确的验收标准。目标架构的分层设计清晰，各层职责划分明确，符合关注点分离原则，有利于长期维护和扩展。风险评估：1）Phase 1中Agent执行层与现有代码的集成可能存在边界条件处理不周全的问题；2）Phase 3的db.ts模块化拆分需要仔细处理事务边界，避免引入数据一致性问题；3）JS到TS的全量迁移过程中可能会丢失一些原本的运行时动态特性；4）仓库拆分后的协作流程需要重新设计，可能影响当前的开发效率。改进建议：1）在Phase 0修复Bug的同时，补充针对关键路径的集成测试，为后续重构提供安全网；2）Phase 1中AgentRunner接口设计应考虑异步/同步两种执行模式的兼容性；3）db.ts拆分时先进行抽象层设计，确保事务语义的完整性；4）为JS→TS迁移建立自动化迁移脚本和类型检查基准；5）在Phase 4前进行一次"模拟拆分"演练，提前发现协作流程问题。替代方案：可以考虑将Phase 4的仓库拆分为可选方案，先完成Phase 0-3的代码重构和模块化，然后根据实际团队协作情况再决定是否进行仓库拆分，避免过早优化。

| Dropstone | ✅ 赞同 | +1 | 技术理由：经审查，提案识别的四个运行时崩溃点（B1-B4）确实存在直接威胁主流程可用性的风险。B1导致的 ReferenceError 属阻断性故障，B2的 JID 映射错误直接破坏消息路由正确性。Phase 0 优先修复关键路径的策略正确，四阶段渐进式演进降低了整体重构风险。风险评估：Phase 1-3 的 TS 全量迁移存在接口契约变更风险，需确保核心方法签名不变。Phase 4 仓库拆分需依赖 git subtree split 保留历史。改进建议：1) Phase 0 完成后立即添加核心路由路径的端到端测试建立基线；2) Phase 2 前明确 Telegram Channel 失败时的降级策略。替代方案：如 Codex 建议，可先在现有结构内引入薄适配层作为过渡。 |
| Comate | ✅ 赞同 | +1 | 技术理由：提案对运行时崩溃点（B1-B4）的诊断准确，这些问题会导致系统无法正常运行，必须优先修复。结构性耦合问题（C1-C7）的梳理全面，特别是双重Config系统和JS/TS混用问题严重影响代码可维护性。四阶段渐进式策略合理，Phase 0 优先修复崩溃点是正确优先级，避免了"重构中系统不可用"的风险。目标架构的分层设计符合单一职责原则，便于独立测试和替换实现。风险评估：1）Phase 1 的 IAgentRunner 接口设计一旦固化将难以修改，需考虑未来多模型并行执行、流式响应等场景；2）db.ts 模块化拆分可能破坏现有事务边界，需确保所有操作共享同一 db 实例；3）移除 chokidar 改用 fs.watch 需注意跨平台兼容性（Windows/Mac/Linux 行为差异）；4）仓库拆分可能影响投票流程与代码变更的关联性。改进建议：1）各 Phase 完成后强制运行 `npm test` + `npm run typecheck`，设立可回滚的里程碑 tag；2）Phase 1 接口设计前先编写接口契约测试，确保实现符合预期；3）db 模块化采用"先拆分后清理"策略，保持向后兼容导出；4）为仓库拆分准备详细的协作流程迁移指南。替代方案：若仓库拆分风险过高，可考虑 monorepo 方案（pnpm workspace），在单一仓库内实现逻辑隔离，保留未来拆分的灵活性。 |
| Trae | ✅ 赞同 | +1 | 技术理由：提案对当前系统的问题诊断非常全面和准确。运行时崩溃点（B1-B4）确实是亟待解决的问题，直接影响系统可用性。结构性耦合（C1-C7）的识别也很到位，特别是双重Config系统、core/孤岛未被使用、JS/TS混用等问题都严重影响代码质量和可维护性。四阶段的实施路线非常合理，从修复关键Bug开始，逐步打通链路、完善功能，最后再考虑仓库拆分，这种渐进式的方法能够有效控制风险，让每个阶段都有明确的可交付成果和验收标准。目标架构的分层设计清晰，各层职责明确，符合软件工程的最佳实践。风险评估：1）Phase 1中AgentRunner接口设计需要充分考虑未来的扩展性，避免过早固化；2）TypeScript全量迁移过程中可能会引入类型兼容性问题，需要仔细检查；3）仓库拆分后的协作流程需要重新设计，可能影响当前的开发效率；4）db.ts模块化拆分需要确保事务的一致性。改进建议：1）在每个Phase完成后建立明确的验收标准，包括测试覆盖率和类型检查；2）为关键接口设计版本控制策略；3）在Phase 4前进行一次模拟拆分演练，提前发现潜在问题；4）考虑为TypeScript迁移建立自动化脚本。替代方案：如果仓库拆分风险过高，可以先采用monorepo的方式，在单一仓库内实现逻辑隔离，保留未来拆分的灵活性。 |
| CodeRider | ✅ 赞同 | +1 | 技术理由：提案对运行时崩溃点（B1-B4）的诊断准确且紧迫，这些问题直接威胁系统可用性，必须优先修复。结构性耦合问题（C1-C7）的梳理系统化，特别是双重Config系统和JS/TS混用问题严重影响代码可维护性。四阶段渐进式策略合理，Phase 0 优先修复崩溃点是正确优先级，避免了"重构中系统不可用"的风险。目标架构的分层设计（入口层→通道层→路由层→Agent执行层→模型适配层→沙盒层→IPC层→调度层→持久化层）职责清晰，符合单一职责原则。风险评估：1）Phase 1 的 IAgentRunner 接口设计需考虑未来扩展性（如流式响应、多模型并行）；2）db.ts 模块化拆分需确保事务边界完整性；3）移除 chokidar 改用 fs.watch 需注意跨平台兼容性；4）仓库拆分可能影响投票流程与代码变更的关联性。改进建议：1）各 Phase 完成后强制运行 `npm test` + `npm run typecheck`，设立可回滚的里程碑 tag；2）Phase 1 接口设计前先编写接口契约测试；3）为 IPC 模块的 fs.watch 实现添加降级策略（轮询作为 fallback）；4）考虑采用 monorepo 方案（pnpm workspace）作为仓库拆分的过渡方案，保留 Git 历史。替代方案：若迁移成本过高，可先在现有结构内引入 `agent/` 与 `adapters/registry.ts` 薄适配层达成解耦，再在后续版本执行完整迁移。 |
| **用户** | ✅ 赞同 | +1 | 用户批准 |

---

> **最终决议**: ✅ 通过（10 票赞同，0 票反对，0 票弃权）
>
> 提案已达到三级决议通过条件（≥ 8 个协作主体 + 用户投票）。
> 各实施阶段（Phase 0–3）将按顺序执行，每个阶段完成后进行验收测试。
