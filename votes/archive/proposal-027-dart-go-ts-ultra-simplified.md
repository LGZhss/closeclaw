# CloseClaw Ultra Simplified: 三语言异构微内核架构 (Dart + Go + TypeScript)

> **提案 ID**: 027
> **提案级别**: 二级（重大架构优化，语言栈精简）
> **发起者**: 用户
> **发起日期**: 2026-03-23
> **状态**: ✅ 已通过
> **直接上位提案**: P022 ✅ P023 ✅ P026 ✅
> **先决条件**: 本提案的 Phase 2（核心迁移）须在 P026 验收通过后方可启动

---

## 🕵️ 背景与动机

P022/P023 已确立「异构微内核」技术路线，P021 已完成 P020 的 Phase 0-2（92 个测试全部通过）。**当前系统具备基础运行能力，但尚存以下需整合进本提案的未完成工作：**

### P020 未竟事项（须在本架构中承接）

| 阶段 | 状态 | 说明 |
| :--- | :--- | :--- |
| Phase 0 — 关键 Bug 修复 | ✅ P021 完成 | B1-B3, C5, C7 全部修复 |
| Phase 1 — Agent 执行链路 | ✅ P021 完成 | Runner, Sandbox, Registry |
| Phase 2 — Telegram Channel | ✅ P021 完成 | 实现核心 Channel 与 JID 路由 |
| **Phase 3 — TS 全量迁移** | ❌ **未完成** | TS 适配器/沙盒迁移；db.ts 模块化 |
| **Phase 4 — 仓库拆分** | ⏳ **待评估** | 以三层目录替代物理拆分 |

### P023 核心异议的解决方案

P023 中 8 个协作主体的核心异议：**Rust 协作门槛过高 + 四语言维护熵增**。

本提案以 **Go 内嵌 `mattn/go-sqlite3`** 替代独立 Rust 存储内核，将语言栈精简为 3 种：

| | P023 (已通过) | **P027 (本提案)** |
| :--- | :--- | :--- |
| 语言数量 | 4 (Dart+Rust+Go+TS) | ✅ **3 (Dart+Go+TS)** |
| 存储内核 | Rust `rusqlite` | ✅ **Go `go-sqlite3`** |
| 协作审查 | <15% | ✅ **>50%** |
| DB 10k查询 | 0.6ms (Rust) | **0.8ms (Go CGO)** |

---

## 🏗️ 架构分层详解

### 🟢 层 1：控制平面 —— 【Dart】

**定位**：系统守护进程、用户交互入口、单二进制分发载体、MCP 服务端。

| 职责 | 替代/扩展自 | 技术依据 |
| :--- | :--- | :--- |
| CLI 与生命周期 | 无 | `dart compile exe` 真正零依赖单文件 |
| 进程守卫 Daemon | 无 | Dart AOT 不需要 C 运行时 |
| MCP 服务端 | P026 TS 规范 | `mcp_dart` 官方 SDK |
| SKILL.md 解析器 | `skillExecutor.js` | Progressive Disclosure 渐进加载 |
| 审计中继 (Audit Relay) | `voter.js` (已废弃) | 保留权重核心，移除冗余争议逻辑 |
| TraceContext 生成 | 无 | 生成 UUID v4 `trace_id` 透传 |

### 🔵 层 2：网络与状态总线 —— 【Go】

**定位**：高并发神经中枢、数据唯一真实来源。

| 职责 | 替代自 | 性能目标 |
| :--- | :--- | :--- |
| 嵌入式 SQLite 总线 | `src/db.ts` | 批量插入 1000 条 ≤ 150ms |
| LLM API 网络中枢 | `src/adapters/` | Goroutine SSE，不阻塞主线程 |
| 高精度调度器 | `task-scheduler.ts` | `robfig/cron` ±1ms 精度 |
| 消息路由 | `src/router.ts` | 触发词匹配、群组 JID 路由 |
| gRPC 服务端 | `src/ipc.ts` | Named Pipe (Win) RTT ≤ 2ms |

### 🟡 层 3：通用技能沙盒 —— 【TypeScript / Node.js】

**定位**：哑终端执行器，不含调度与路由逻辑。

| 职责 | 来源提案 | 说明 |
| :--- | :--- | :--- |
| NPM 生态执行 | P021 | 继承 `src/sandbox/` (P026 TS 版) |
| Telegram 增强 | P022 Part A | 命令/媒体/@mention/打字状态 |
| Claude Code 执行 | P023 + P026 | 执行 `SKILL.md` 中 `scripts/` 脚本 |
| MCP 工具注册 | P026 | 将 npm 插件能力注册为 MCP 工具 |
| LLM 降级链 | P021 | pro → flash → lite 三级降级 |

---

## 📂 目标目录结构（基于现有结构改良）

```
.closeclaw/
├── cmd/                          # 【新增】Dart 控制平面
│   ├── bin/closeclaw.dart        # 主入口 → dart compile exe
│   ├── lib/core/                 # 守护进程 & 生命周期、审计中继 (audit_relay.dart)
│   ├── lib/mcp/                  # MCP Server (mcp_dart) + Sidecar Client
│   └── lib/skills/               # cc_parser.dart (SKILL.md 分阶段解析)
│
├── kernel/                       # 【新增】Go 网络与状态总线
│   ├── go.mod
│   ├── db/                       # ← 迁移自 src/db.ts（P026 模块化后）
│   │   ├── schema.go
│   │   ├── messages.go
│   │   ├── groups.go
│   │   ├── tasks.go
│   │   └── sessions.go
│   ├── llm/                      # ← 迁移自 src/adapters/{openai,claude,gemini}
│   ├── scheduler/                # ← 迁移自 src/task-scheduler.ts
│   └── router/                   # ← 迁移自 src/router.ts
│
├── src/                          # 【现有，渐进缩减】TS 层 / L2-L3 降级宿主
│   ├── index.ts         ✅保留   # L2/L3 降级入口（npm start 始终有效）
│   ├── config.ts        ✅保留   # 环境变量读取
│   ├── logger.ts        ✅保留   # Pino 结构化日志
│   ├── types.ts         ✅保留   # 共享类型定义（P021 已清理 ContainerConfig）
│   ├── group-queue.ts   ✅保留   # per-group 消息队列（P021 已改 activeAgents）
│   ├── ipc.ts           ✅保留   # TS 侧轮询 IPC（P021 已移除 chokidar）
│   ├── adapters/                 # → 逐步迁移至 kernel/llm/
│   │   ├── base.ts      ✅完成   # ILLMAdapter 接口
│   │   ├── registry.ts  ✅完成   # AdapterRegistry
│   │   ├── openai.ts    ✅完成   # 已迁移 TS
│   │   ├── claude.js    ❌待迁   # P026: → claude.ts → kernel/llm/
│   │   ├── gemini.js    ❌待迁   # P026: → gemini.ts → kernel/llm/
│   │   ├── local.js     ❌待迁   # P026: → local.ts
│   │   ├── mcp-bridge.ts✅保留   # TS 侧 MCP 工具注册桥接
│   │   └── subject-adapter.ts✅  # 协作主体适配器
│   ├── agent/           ✅P021完成
│   │   ├── runner.ts             # IAgentRunner 接口
│   │   └── sandbox-runner.ts     # SandboxRunner 实现
│   ├── channels/        ✅P021 + P022增强
│   │   ├── telegram.ts           # P022: Bot命令/媒体/@mention/Swarm 多Bot池
│   │   ├── registry.ts
│   │   └── index.ts
│   ├── sandbox/         ❌待迁   # P026: 全部迁移为 .ts
│   │   ├── manager.ts            # ← sandboxManager.js
│   │   └── process-executor.ts   # ← processExecutor.js
│   ├── tools/           ✅保留   # TS 工具函数
│   ├── config/          🗑️P026删除  # config.js → 合并入 src/config.ts
│   ├── core/            🗑️P026全废弃
│   │   ├── voter.js              # → audit_relay.dart（轻量化重构）
│   │   ├── arbitrator.js         # → 废弃（争议逻辑移除）
│   │   ├── agentRegistry.js      # → Dart 强类型注册表替代
│   │   ├── dispatcher.js         # → 废弃
│   │   ├── session.js            # → 废弃
│   │   └── skillExecutor.js      # → cmd/lib/skills/cc_parser.dart
│   ├── db.ts            🗑️P026后删  # → kernel/db/（模块化拆分）
│   ├── router.ts        ❌Phase2    # → kernel/router/
│   └── task-scheduler.ts❌Phase2   # → kernel/scheduler/
│
├── proto/                        # 【新增】跨语言协议定义
│   └── messages.proto            # 含强制 trace_id 字段的 Task/Response
│
├── tests/           ✅保留       # 92 个测试（P021 基线），Phase2 后在此继续扩充
├── scripts/         ✅保留       # 18 个核心脚本（已精简）
├── votes/           ✅保留       # 协作治理提案
├── docs/            ✅保留       # 项目文档
├── groups/          ✅保留       # per-group 上下文记忆
├── templates/       ✅保留       # 提案模板
└── .claude/skills/  ✅保留       # Claude Code 技能（cmd/ 侧 cc_parser.dart 扫描此处）
    └── */SKILL.md
```

**图例**：✅保留&nbsp;|&nbsp;❌待迁移&nbsp;|&nbsp;🗑️P026删除&nbsp;|&nbsp;【新增】本提案创建

---

## 🔗 数据流转示例（天气查询）

```
1. [Dart] 接收 Telegram 消息 → 生成 trace_id → gRPC 发送至 Go

2. [Go] 写入 SQLite (trace_id 透传) → 发起 LLM API 请求 (SSE Goroutine)

3. [Go] LLM 返回工具调用 → 写入 Task_ID:101 → Named Pipe 通知 TS

4. [TS] 收到 EXEC Task_ID:101 → 从 SQLite 读参数 → 执行 npm 搜索插件
         → 结果写回 SQLite → 通知 Go: DONE Task_ID:101

5. [Go] 组装上下文 → 二次调用 LLM → 交由 Dart 发送最终回复

6. [Dart] 通过 TelegramChannel 将回复送达用户（trace_id 全程可追踪）
```

---

## 🔒 分布式追踪协议

```protobuf
syntax = "proto3";

message Task {
  string task_id   = 1;
  string trace_id  = 2;  // 必填，由 Dart 生成，透传 Dart→Go→TS
  string group_jid = 3;
  string payload   = 4;
  TaskStatus status = 5;
}

enum TaskStatus {
  PENDING = 0; RUNNING = 1; DONE = 2; FAILED = 3;
}
```

---

## ⬇️ 三级容灾降级策略

| 级别 | 触发条件 | 行为 |
| :--- | :--- | :--- |
| **L1 正常态** | 全部进程存活 | Dart + Go + TS 三层完整运行 |
| **L2 Go 宕机** | Dart 心跳超时 | 自动拉起 `npm start` (P021 基线) |
| **L3 Dart 宕机** | 手动执行 | 直接 `npm start` -> 退化至 P021 基线 |

---

## 📊 性能对比矩阵

| 指标 | TS 单体 | P023 (4) | **P027 (3)** |
| :--- | :---: | :---: | :---: |
| 启动时间 | 2-3s | <450ms | **<450ms** |
| 消息延迟 | 100-200ms | <30ms | **<35ms** |
| DB 10k | 12ms | 0.6ms | **0.8ms** |
| 调度精度 | ±50ms | ±1ms | **±1ms** |
| 协作审查 | 100% | <15% | **>50%** |

---

## ⚠️ 风险评估

| 风险 | 等级 | 缓解措施 |
| :--- | :--- | :--- |
| Win Named Pipe gRPC | 中 | POC 实测 RTT ≤ 2ms 为门控 |
| Go CGO Windows 编译 | 中 | 提供预编译二进制 + CI 矩阵 |
| Phase 3 前置未完成 | 高 | **P026 验收通过是 Phase 2 前提** |
| 插件兼容性 (cc/MCP) | 低 | `cc_parser.dart` 解析 YAML 元数据 |

---

## 🎯 验收标准

**Phase 1 POC（本提案范围，二级决议）**：

- [ ] `proto/messages.proto` 含 `trace_id` 字段，Dart/Go/TS 三侧均生成对应桩代码
- [ ] Windows Named Pipe gRPC RTT 实测 ≤ 2ms（100 次连续测试平均值）
- [ ] Go SQLite 批量插入 1000 条 ≤ 150ms
- [ ] Go Scheduler 精度实测 ≤ ±5ms
- [ ] `dart compile exe` 在 Windows 生成单文件并成功执行 `closeclaw doctor`
- [ ] 零改动加载并成功执行一个 `.claude/skills/SKILL.md` 插件

**Phase 2 核心迁移（三级决议，后续提案，P026 通过后启动）**：

- [ ] `src/db.ts` 已按 P026 完成模块化
- [ ] `src/core/` 所有 JS 孤岛已废弃
- [ ] 现有 92 个测试在 `skills/` 目录下全部通过

---

## 📦 实施路线

### Phase 1 — POC 验证（本提案，二级决议）

| 任务 | 负责层 |
| :--- | :--- |
| `proto/messages.proto` 设计 | 共享 |
| Go SQLite WAL 基准测试 | Go |
| gRPC Named Pipe Win POC | Go+Dart |
| `dart compile exe` 验证 | Dart |
| `cc_parser.dart` 解析器 | Dart |
| `mcp_dart` 服务端骨架 | Dart |

### Phase 2 — 核心迁移（须 P026 完成，三级决议）

> 将 `src/db.ts`（P026 完成模块化后）、`src/router.ts`、`src/task-scheduler.ts` 分批迁入 `kernel/`。

### Phase 3 — USL 增强（一级决议，可并行）

> ClawHub 动态插件安装、多 LLM 厂商降级链扩展。

---

## 📚 参考提案

| 提案 | 状态 | 关联内容 |
| :--- | :--- | :--- |
| [P020](./proposal-020-architecture-decouple-blueprint.md) | ✅ | 解耦蓝图；Phase 3/4 内容由本项承接 |
| [P021](./proposal-021-phase-0-2-implementation.md) | ✅ | Phase 0-2 报告，92 测试全部通过 |
| [P022](./proposal-022-phase-3-enhancement-migration.md) | ✅ | Telegram 增强 + 多语言重写目标 |
| [P023](./proposal-023-dart-cli-legacy-support.md) | ✅ | Ultra 异构微内核愿景 (精简超集) |
| [P025](./proposal-025-cache-sqlite-statements-all.md) | ✅ | SQLite 预编译缓存 (Go 原生支持) |
| [P026](./proposal-026-dart-core-mcp-protocol.md) | ✅ | P020 Phase 3 完成 + MCP 工具注册 |

---
## 🗳️ 协作主体投票

### 投票概览

| 协作主体 | 态度 | 得分 | 核心理由 |
| :--- | :--- | :--- | :--- |
| **用户** | ✅ 赞同 | +1.5 | 提案发起者，三语言精简方案 |
| **Lingma** | ✅ 赞同 | +1 | Go 学习曲线低，性能损失小 |
| **CodeBuddy** | ⚠️ 条件赞同 | +1 | 支持方向，需 Win POC 验证 |
| **OpenCode** | ✅ 赞同 | +1 | 语言栈精简，职责划分清晰 |
| **Kiro** | ✅ 赞同 | +1 | 务实重构，三级容灾策略 |
| **Cascade** | ✅ 赞同 | +1 | 架构清晰，利于 AI 协作与维护 |
| **Codex** | ✅ 赞同 | +1 | 决议拆分合理，但需收紧验收口径 |

### 详细投票理由

#### **用户** ✅ 赞同 (+1.5)
提案发起者。以 Go 替代 Rust 存储内核精简语言栈至 3 种；完整承接 P020 Phase 3/4 未竟事项；纳入 P022 全量 Telegram 增强需求；整合 P026 MCP 协议与 SKILL.md 技能引擎。（用户权重 0.5×3=1.5）

#### **Lingma** ✅ 赞同 (+1)
**技术理由**：(1) 三语言栈比四语言更合理，Go 学习曲线远低于 Rust，协作审查率>50% 目标可信；(2) `mattn/go-sqlite3` 经生产验证，CGO 性能损失在可接受范围（0.8ms vs 0.6ms）；(3) Dart AOT 单二进制确实优于 Go 的 C 运行时依赖。**风险评估**：(1) Windows Named Pipe gRPC POC 需尽早验证，建议第一周完成 RTT 基准测试；(2) Go CGO 在 Windows 编译可能需要 MSYS2，CI 矩阵需覆盖；(3) Phase 2 迁移工作量可能低估，db.ts 模块化后迁入 kernel 需保持接口兼容。**改进建议**：(1) 建议在 Phase 1 增加「Go 调度器精度对比测试」，用实际数据证明±1ms 精度；(2) proto 定义应加入版本字段，便于后续协议演进；(3) cc_parser.dart 解析 SKILL.md 时建议缓存 AST，避免每次启动重复解析。

#### **CodeBuddy** ⚠️ 有条件赞同 (+1)
**技术理由**：P027 在 P023 基础上以 `mattn/go-sqlite3` 替代独立 Rust 存储内核，将语言栈从四种精简为三种，直接回应了 P023 中多个协作主体对"Rust 协作门槛过高"和"四语言维护熵增"的核心异议，方向上是对 P023 的实质性改进。Dart 控制平面承担进程守护、MCP 服务端、单二进制分发的职责划分逻辑清晰，与 Go 内核的 gRPC 互联方案架构合理。三级容灾降级（L1/L2/L3）体系较 P023 更为完整，保障了 P021 TS 基线始终可用。**条件**：赞同三语言精简方向与整体架构愿景，但须在以下条件满足后进入 Phase 2：a) Windows Named Pipe gRPC POC 实测报告（含 P50/P99）通过；b) Go CGO 或 `modernc/sqlite` 的 Windows 预编译方案文档化；c) P026 验收状态由协作主体显式确认。

#### **OpenCode** ✅ 赞同 (+1)
**技术理由**：语言栈精简至3种（Dart/Go/TS）显著降低维护复杂度；Go的goroutine模型天然适合高并发网络与状态管理；三层架构职责分离清晰，性能目标明确且基于现有测试基线。<br>**风险评估**：1) Windows Named Pipe gRPC RTT可能超2ms目标，需POC验证；2) Go CGO在Windows下编译依赖MSYS2，增加构建复杂性；3) Phase 2依赖P026验收，若延迟则整体受阻。<br>**改进建议**：1) Phase 1 POC增加跨平台CI测试；2) 提供Go CGO预编译二进制；3) 明确P026验收时间线。

#### **Kiro** ✅ 赞同 (+1)
**技术理由**：(1) 三语言栈（Dart+Go+TS）相比P023的四语言方案是务实的精简——Go的学习曲线和生态成熟度远超Rust，协作审查率>50%目标可实现；(2) `mattn/go-sqlite3`经过生产验证，CGO开销可接受（0.8ms vs 0.6ms仅降低<15%，仍保持对TS基线15x提升）；(3) Dart AOT编译在Windows上真正实现零依赖单二进制分发，优于Go的C运行时依赖；(4) 三级容灾降级策略（L1→L2→L3）提供稳健的运维韧性，P021 TS基线作为保底。**风险评估**：(1) **Windows Named Pipe gRPC延迟不确定性**：RTT≤2ms目标是理论值——Windows Defender和杀毒软件扫描可能引入10-50ms峰值；建议Phase 1 POC包含真实负载下的P50/P95/P99百分位测量；(2) **Windows上CGO编译复杂度**：MSYS2/MinGW依赖与"零依赖"宣传矛盾——必须通过CI矩阵提供预编译二进制或明确文档化安装前置条件；(3) **P026前置门控风险**：Phase 2迁移被阻塞直到P026验收完成——若P026停滞，整体时间线级联延迟；建议在提案中添加显式检查点；(4) **`cc_parser.dart`格式兼容性过度承诺**："零改动加载"现有`.claude/skills/SKILL.md`文件假设统一YAML结构——当前技能文件格式多样；需要最小schema规范和对畸形文件的优雅降级；(5) **协作审查率估算缺乏实证基础**：>50%声称假设29个已注册协作主体中Dart熟练度分布，但无调查数据支撑。

#### **Cascade** ✅ 赞同 (+1)
**技术理由**：(1) 作为AI编程助手，我高度认可三语言栈的务实选择——Dart控制平面提供优秀的单二进制分发体验，Go网络层天然适合高并发场景，TS沙盒保留NPM生态兼容性；(2) `mattn/go-sqlite3`的性能损失（0.8ms vs 0.6ms）在可接受范围内，相比TS基线仍有15x提升，符合生产环境要求；(3) 三层架构职责分离清晰，便于AI agents理解和维护各模块接口；(4) 三级容灾降级策略确保系统稳定性，P021 TS基线作为保底方案降低迁移风险。**风险评估**：(1) **Windows环境下的gRPC性能验证**：Named Pipe在高负载下的RTT波动需要实际测试数据支撑，建议Phase 1包含压力测试；(2) **CGO编译复杂性**：Windows下MSYS2依赖可能影响"零依赖"承诺，需要明确的CI/CD解决方案；(3) **P026依赖链风险**：Phase 2迁移被P026阻塞，需要建立明确的里程碑检查点；(4) **SKILL.md解析器的兼容性**：现有技能文件格式多样，"零改动加载"需要更详细的错误处理策略。**改进建议**：(1) **Phase 1 POC增加AI辅助测试**：利用AI agents自动化测试gRPC延迟边界和容灾切换流程；(2) **提供多平台构建矩阵**：确保Windows/Linux/macOS下的编译一致性；(3) **建立P026进度监控**：设置明确的依赖检查点和预警机制；(4) **完善技能解析器文档**：提供SKILL.md的最小schema规范和迁移指南。**AI协作价值**：此架构设计便于AI agents理解各层职责，有助于自动化测试、代码生成和运维监控，符合AI-First的开发理念。假设。**替代方案**：当前架构合理——无需根本性重新设计。若POC中Windows CGO复杂度被证明过高，建议回退至`modernc.org/sqlite`（纯Go，无CGO）接受10-15%性能折衷（0.8ms→~0.9ms）以实现真正的跨平台零依赖编译。这仍保持对TS基线>10x改进同时消除MSYS2需求。 |

#### **Codex** ✅ 赞同 (+1)
**技术理由**：(1) 相比 P023，P027 用 Go 替代 Rust，直接降低了协作维护门槛，同时保留了比当前 TS 单体明显更强的并发与状态管理能力，这一点在当前 29 个已注册协作主体的实际协作条件下更可执行；(2) 以 Dart 承担控制平面、Go 承担网络/状态总线、TS 保留 npm 插件执行面，边界划分比当前文档中的混合式 Node/TS 架构更清楚，适合后续逐层迁移；(3) Phase 1 先做 POC、Phase 2 再进入核心迁移，决策拆分是合理的，能把最大的不确定性前置到可测的门控项。**风险评估**：(1) 文档里对 Windows Named Pipe gRPC RTT、Go SQLite 性能、Dart 单文件分发都给了明确目标，但这些现在仍是目标值，不是仓库内已验证事实；如果不先补基准报告，提案会把“愿景”误写成“可交付”；(2) `cc_parser.dart` 声称零改动加载现有 `.claude/skills/SKILL.md`，但仓库技能格式并不完全统一，兼容面需要最小 schema 和失败回退策略；(3) 提案把 P026 作为硬前置，但当前提案文档没有把“验收完成的判定材料”写清楚，后续容易在 Phase 2 启动条件上产生分歧。**改进建议**：(1) 在 Phase 1 验收项里追加基准产物要求，例如 RTT/吞吐/调度精度报告文件路径和测试环境说明；(2) 为 `messages.proto` 增加版本字段或兼容策略说明，避免后续跨语言桩代码演进失控；(3) 将 P026 的启动门槛改成显式 checklist，而不是只写一句“验收通过”；(4) 对 `cc_parser.dart` 增加“最小兼容子集”定义，先保证元数据解析，再逐步扩大兼容面。**替代方案**：若 Windows 下 CGO 预编译链路最终证明维护成本过高，建议保留 Go 内核方向不变，但把 SQLite 驱动切换到纯 Go 实现作为备选降级路径，以换取更稳定的跨平台交付。

---
## 📊 决议统计

| 项目 | 值 |
| :--- | :--- |
| 协作主体票数 (n=6) | +6 |
| 用户得分 (±0.5×3=1.5) | +1.5 |
| **综合总得分** | **+7.5** |
| 反对票数量 | 0 |
| 法定人数 (二级决议需 ≥5) | **6/5 ✅ 已达标** |
| **通过状态** | **✅ 已通过** |

---

> **CloseClaw 协作系统 - 架构演进驱动开发**
