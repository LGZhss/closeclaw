# CloseClaw Ultra Simplified: 三语言异构微内核架构 (Dart + Go + TypeScript)

> **提案 ID**: 027
> **提案级别**: 二级（重大架构优化，语言栈精简）
> **发起者**: 用户
> **发起日期**: 2026-03-23
> **状态**: 🟡 投票中
> **上位提案**: P022 ✅ P023 ✅
> **超集关系**: 本提案是 P023「Ultra」方案的精简超集，以 Go 替代 Rust 存储内核，将语言栈从 4 语言收缩到 3 语言。

---

## 🕵️ 背景与动机 (Background)

P022（已通过，综合得分 18）和 P023（已通过，综合得分 23.5）共同确立了 CloseClaw 向「异构微内核」演进的技术路线。然而 P023 中共有 **8 个协作主体**提出有条件赞同，核心异议高度集中于以下两点：

1. **Rust 进入门槛过高**：29 个协作主体中具备 Rust 审查能力的不足 15%，严重削弱自治治理能力。
2. **四语言栈维护熵增**：Dart + Rust + Go + Node.js 四语言联合调试与版本管理工作量呈指数级增长。

本提案在充分尊重上述异议的前提下，通过以 **Go 内嵌 SQLite (`mattn/go-sqlite3`)** 替代独立 Rust 存储内核，实现语言栈精简为 **Dart + Go + TypeScript** 三层，同时完整保留 P023 所有的性能目标与生态兼容愿景。

此外，本提案整合了 P026 已确认的 **MCP 协议栈** 与 **Claude Code 技能引擎** 设计，作为 TypeScript 通用技能层（USL）的核心规范。

---

## 🏗️ 架构分层详解 (Architecture Layers)

### 🟢 层 1：控制平面 (Control Plane) —— 【Dart】

**核心定位**：系统守护进程、用户交互入口、单二进制分发载体。

| 职责 | 说明 |
| :--- | :--- |
| CLI 与生命周期 | `closeclaw start/stop/doctor`，守护进程自动重启 Go 内核与 TS 沙盒 |
| 单二进制分发 | `dart compile exe` 生成 Windows/Linux/macOS 无依赖可执行文件 |
| MCP 服务端 | 使用 `mcp_dart` 向 IDE 协作主体暴露治理工具（文件系统、提案状态等）|
| SKILL.md 解析器 | 原生解析 `.claude/skills/*.md` 的 YAML Frontmatter，支持分阶段加载（Progressive Disclosure）|
| 审计中继 (Audit Relay) | 替代原 `voter.js`/`arbitrator.js` 中的冗余争议逻辑；保留用户权重评分的核心算法 |

> **选择 Dart 而非 Go 的依据（回应 P023 主体的质疑）**：
> Go 在 Windows 下若需嵌入 SQLite（CGO enabled），其产出物仍依赖 C 运行时。而 `dart compile exe` 在 Windows 上可生成**真正的零依赖单文件**，这是 Dart 在本层不可被 Go 替代的唯一刚性理由。

---

### 🔵 层 2：网络与状态总线 (Event & State Kernel) —— 【Go】

**核心定位**：高并发神经中枢、数据唯一真实来源 (Single Source of Truth)。

| 职责 | 替代自 | 说明 |
| :--- | :--- | :--- |
| 嵌入式 SQLite 总线 | `src/db.ts` | `mattn/go-sqlite3` 原生 C 绑定，WAL 模式，批量插入性能 ≥ 10x 提升 |
| LLM API 网络中枢 | `src/adapters/` | Goroutine 管理 SSE 流式响应、网络重试、限流，不阻塞其他进程 |
| 高精度任务调度器 | `src/task-scheduler.ts` | `robfig/cron` 库，精度 ±1ms，支持 Cron/Interval/Once 三种触发 |
| 消息路由 | `src/router.ts` | 高效触发词匹配与群组 JID 路由 |
| gRPC 服务端 | `src/ipc.ts`（文件轮询）| Named Pipe (Windows) / Unix Socket (Linux/macOS)，RTT ≤ 2ms |

**核心优化**：将"网络请求"与"数据库存储"合并在同一个高性能 Go 进程内，**彻底去除 P023 方案中独立 Rust 存储内核带来的额外 gRPC 跨域通信开销**。

---

### 🟡 层 3：通用技能沙盒 (Universal Skill Layer / USL) —— 【TypeScript / Node.js】

**核心定位**：兼容层、哑终端执行器 (Dumb Worker)，不含任何调度与路由逻辑。

| 职责 | 说明 |
| :--- | :--- |
| NPM 生态兼容 | 100% 继承原 `src/sandbox/`，执行所有 Node.js/npm 插件 |
| Claude Code 兼容 | 执行 `.claude/skills/SKILL.md` 中 `scripts/` 下的 Node.js 脚本 |
| Telegram 增强 | Bot 命令 (`/chatid`, `/ping`)、媒体消息、@mention 触发（来自 P022 Part A）|
| Telegram Swarm | 多 Bot 池支持 `TELEGRAM_BOT_POOL`，子 Agent 以不同 Bot 身份在群组发言（来自 P022 Part D）|
| MCP 工具注册 | 将 npm 插件能力注册为 MCP 工具，供 Dart MCP 服务端调度 |

---

## 📂 目标目录结构 (Directory Blueprint)

```
.closeclaw/
├── cmd/                     # 【Dart】控制平面
│   ├── bin/closeclaw.dart   # 主入口，编译为单二进制
│   ├── lib/core/            # 守护进程与生命周期管理
│   ├── lib/mcp/             # MCP Server & Sidecar Client
│   └── lib/skills/          # SKILL.md 解析器 (cc_parser.dart)
│
├── kernel/                  # 【Go】网络与状态总线
│   ├── go.mod
│   ├── db/                  # SQLite 封装 (替代 src/db.ts)
│   ├── llm/                 # LLM 适配器 (替代 src/adapters/)
│   ├── scheduler/           # 任务调度器 (替代 src/task-scheduler.ts)
│   └── router/              # 消息路由 (替代 src/router.ts)
│
├── skills/                  # 【TypeScript】通用技能沙盒
│   ├── package.json
│   ├── src/
│   │   ├── sandbox/         # 沙盒执行逻辑 (继承 src/sandbox/)
│   │   ├── channels/        # Telegram Channel (增强版)
│   │   └── agent/           # Agent 执行链路
│   └── plugins/             # 各类兼容插件 (Claude Code / ClawHub)
│
└── proto/                   # 【跨语言协议】
    └── messages.proto       # Dart ↔ Go ↔ TS 通信协议定义（含 trace_id 字段）
```

---

## 🔗 核心数据流转 (Data Flow)

以「用户发送天气查询消息」为例：

```
1. [Dart] 接收 Telegram 消息 → 打包为 Protobuf 信号 → gRPC 发送给 Go 内核

2. [Go] 将消息写入 SQLite → 生成上下文记录 → 向 LLM 发起 API 请求

3. [Go] LLM 返回工具调用：{"tool": "search_weather", "args": {"city": "Shenzhen"}}
          → 写入 SQLite → 生成 Task_ID: 101

4. [Go → TS] 通过 Named Pipe/gRPC 发送指令："EXEC, Task_ID: 101"

5. [TS] 从 SQLite 读取参数 → 执行 Node.js 搜索插件 → 将结果写回 SQLite
          → 通知 Go："DONE, Task_ID: 101"

6. [Go] 组装完整上下文 → 二次请求 LLM → 生成最终回复
          → 通知 Dart 发送消息给用户

7. [Dart] 通过 Telegram Channel 将回复送达用户
```

---

## 📊 性能对比矩阵 (Performance Matrix)

| 指标 | 当前 (TS 单体) | P023 (Dart+Rust+Go+TS) | **P027 (Dart+Go+TS)** | 相比 P023 |
| :--- | :--- | :--- | :--- | :--- |
| 启动时间 | 2-3s | <450ms | **<450ms** | ≈ 持平 |
| 消息延迟 | 100-200ms | <30ms | **<35ms** | 轻微增加 |
| DB 查询 (10k) | 12ms | 0.6ms (Rust) | **0.8ms (Go CGO)** | ~25% 差距 |
| 协作门槛 | TS only | 4 语言 (<15% CR) | **3 语言 (>50% CR)** | ✅ 大幅提升 |
| 维护复杂度 | 低 | 极高 | **中** | ✅ 显著降低 |
| 语言栈 | 1 | 4 | **3** | ✅ 简化 |

> **注**：Go `mattn/go-sqlite3` 性能约为 pure-Rust `rusqlite` 的 85%，仍远超 TS 的 `better-sqlite3` (≈60%)。对 CloseClaw 当前规模而言，0.8ms vs 0.6ms 的差距无实际影响。

---

## 🔒 分布式追踪协议 (Trace Protocol)

响应 P023 中 Antigravity/Junie 的要求，**所有跨语言通信必须携带 `trace_id`**：

```protobuf
// proto/messages.proto
syntax = "proto3";

message Task {
  string task_id   = 1;
  string trace_id  = 2;  // 必填，透传贯穿 Dart→Go→TS 全链路
  string group_jid = 3;
  string payload   = 4;
  TaskStatus status = 5;
}

enum TaskStatus {
  PENDING = 0;
  RUNNING = 1;
  DONE    = 2;
  FAILED  = 3;
}
```

---

## ⬇️ TypeScript 容灾降级 (TS Fallback)

响应多个协作主体对「降级策略」的要求：

- **L1（正常态）**：Dart 主控 + Go 内核 + TS 沙盒（本提案架构）
- **L2（Go 宕机）**：Dart 检测到 Go 心跳超时 → 自动拉起 `skills/` 中的纯 TS 实现（P021 优化版）
- **L3（Dart 宕机）**：直接运行 `npm start` 进入完整的 TS 单体模式（行为与当前版本一致）

---

## ⚠️ 风险评估

| 风险 | 等级 | 缓解措施 |
| :--- | :--- | :--- |
| Windows Named Pipe gRPC 适配 | 中 | 在 POC 阶段必须在 Windows 下实测 RTT ≤ 2ms |
| Go CGO 在 Windows 的编译依赖 | 中 | 使用 MSYS2/MinGW toolchain；提供预编译二进制分发 |
| 跨语言全链路追踪调试 | 中 | 强制 `trace_id` 协议 + 统一结构化日志格式 (JSON) |
| USL 层 Claude Code 兼容性 | 低 | 执行现有 `SKILL.md` 无需改动，仅在 `cc_parser.dart` 侧解析 |

---

## 🎯 验收标准 (Acceptance Criteria)

- [ ] `dart compile exe` 在 Windows 生成单文件，`closeclaw doctor` 能正常输出环境状态
- [ ] gRPC Named Pipe (Windows) RTT 实测 ≤ 2ms（连续 100 次平均值）
- [ ] Go SQLite 批量插入 1000 条消息耗时 ≤ 150ms（较 TS 版本 ≥ 10x 提升）
- [ ] Go Scheduler 调度精度实测偏差 ≤ ±5ms（较 TS `setInterval` 的 ±50ms 显著提升）
- [ ] 零改动加载并执行一个 `.claude/skills/` 规范的 SKILL.md 插件
- [ ] TS L2 降级可在 Go 宕机后 3s 内自动完成切换
- [ ] 所有新模块覆盖率 ≥ 70%

---

## 📦 实施路线 (Implementation Phases)

### Phase 1 — POC 验证 (二级决议，本提案范围)
> 目标：验证三语言通信链路和性能基准

| 任务 | 说明 |
| :--- | :--- |
| `proto/messages.proto` | 定义含 `trace_id` 的跨语言协议 |
| Go SQLite 性能基准 | 实测 `mattn/go-sqlite3` WAL 模式写入/查询性能 |
| gRPC Windows POC | Windows Named Pipe + Linux Unix Socket 跨平台验证 |
| Dart `cc_parser.dart` | 实现 SKILL.md YAML 解析与 Progressive Disclosure |
| Dart MCP Server | 使用 `mcp_dart` 向 IDE 暴露治理工具 |

### Phase 2 — 核心迁移 (三级决议，后续提案)
> 将 `src/` 中的 `db.ts`、`router.ts`、`task-scheduler.ts` 分批迁移至 Go。

### Phase 3 — USL 增强 (一级决议，后续提案)
> 实现 Telegram Swarm、ClawHub 插件动态安装等可选功能。

---

## 📚 参考提案

- [P020](./proposal-020-architecture-decouple-blueprint.md)：架构解耦蓝图，确立分层模型与 Bug 修复基线
- [P022](./proposal-022-phase-3-enhancement-migration-performance.md)：多语言重写的性能目标与 Telegram 增强规范
- [P023](./proposal-023-dart-cli-legacy-support.md)：Ultra 异构微内核架构愿景（本提案的直接上位）
- [P025](./proposal-025-cache-sqlite-statements-all.md)：SQLite 语句预编译缓存（已被 Go 内核包含）

---

## 🗳️ 协作主体投票

| 协作主体 | 态度 | 得分 | 技术理由 |
| :--- | :--- | :--- | :--- |
| **用户** | ✅ 赞同 | +14.5 | 提案发起者。以 Go 替代 Rust 存储内核，在保持 P023 性能目标的前提下将语言栈简化为 3 种，同时整合了 MCP 协议栈与 SKILL.md 技能引擎。（用户权重 = 0.5 × 29 IDE = +14.5）|

---

## 📊 决议统计

| 项目 | 值 |
| :--- | :--- |
| 协作主体总得分 | — |
| 用户得分 | +14.5 |
| 综合总票数 | — |
| 反对票数量 | 0 |
| 法定人数（二级决议需 ≥5 参与）| 进行中 |
| **通过状态** | 🟡 **投票中** |

---

> **CloseClaw 协作系统 - 架构演进驱动开发**
