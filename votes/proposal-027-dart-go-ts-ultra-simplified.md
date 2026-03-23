# CloseClaw Ultra Simplified: 三语言异构微内核架构 (Dart + Go + TypeScript)

> **提案 ID**: 027
> **提案级别**: 二级（重大架构优化，语言栈精简）
> **发起者**: 用户
> **发起日期**: 2026-03-23
> **状态**: 🟡 投票中
> **直接上位提案**: P022 ✅ P023 ✅ P026 ✅
> **先决条件**: 本提案的 Phase 2（核心迁移）须在 P026 验收通过后方可启动

---

## 🕵️ 背景与动机

P022/P023 已确立「异构微内核」技术路线，P021 已完成 P020 的 Phase 0-2（92 个测试全部通过）。**当前系统具备基础运行能力，但尚存以下需整合进本提案的未完成工作：**

### P020 未竟事项（须在本架构中承接）

| 阶段 | 状态 | 说明 |
| :--- | :--- | :--- |
| Phase 0 — 关键 Bug 修复 | ✅ P021 完成 | B1-B3, C5, C7 全部修复 |
| Phase 1 — Agent 执行链路 | ✅ P021 完成 | AgentRunner, SandboxRunner, AdapterRegistry |
| Phase 2 — Telegram Channel | ✅ P021 完成 | 42 个测试全部通过 |
| **Phase 3 — TS 全量迁移** | ❌ **未完成** | claude.ts / gemini.ts / sandbox/*.ts 迁移；db.ts 模块化；src/core/ 废弃 |
| **Phase 4 — 仓库拆分** | ⏳ **待评估** | `closeclaw-collab` + `closeclaw-runtime` 分仓；本提案选择以三层目录替代物理拆分 |

### P023 核心异议的解决方案

P023 中 8 个协作主体的核心异议：**Rust 协作门槛过高 + 四语言维护熵增**。

本提案以 **Go 内嵌 `mattn/go-sqlite3`** 替代独立 Rust 存储内核，将语言栈精简为 3 种：

| | P023（已通过）| **P027（本提案）** |
|:---|:---|:---|
| 语言数量 | 4 (Dart+Rust+Go+TS) | ✅ **3 (Dart+Go+TS)** |
| 存储内核 | Rust `rusqlite` | ✅ **Go `mattn/go-sqlite3`** |
| 协作审查率 | <15% | ✅ **>50%** |
| DB 性能（10k 查询）| 0.6ms（Rust）| **0.8ms（Go CGO，仍为 TS 的 15x）** |

---

## 🏗️ 架构分层详解

### 🟢 层 1：控制平面 —— 【Dart】

**定位**：系统守护进程、用户交互入口、单二进制分发载体、MCP 服务端。

| 职责 | 替代/扩展自 | 技术依据 |
| :--- | :--- | :--- |
| CLI 与生命周期 | 无（全新）| `dart compile exe` → Windows 真正零依赖单文件 |
| 进程守卫 Daemon | 无（全新）| Go 因 CGO 在 Windows 下仍需 C 运行时，Dart AOT 不需要 |
| MCP 服务端 | P026 定义的 TS 侧工具注册规范 | `mcp_dart` 官方 SDK，向 IDE 暴露治理工具 |
| SKILL.md 解析器 | `src/core/skillExecutor.js`（已废弃）| Progressive Disclosure：启动时仅加载 YAML 元数据 |
| 审计中继 (Audit Relay) | `voter.js` / `arbitrator.js`（已废弃）| 保留用户权重核心算法，移除无用的争议案例逻辑 |
| TraceContext 生成 | 无（全新）| 生成 UUID v4 `trace_id`，透传至 Go 和 TS |

### 🔵 层 2：网络与状态总线 —— 【Go】

**定位**：高并发神经中枢、数据唯一真实来源。

| 职责 | 替代自 | 性能目标 |
| :--- | :--- | :--- |
| 嵌入式 SQLite 总线 | `src/db.ts`（P026 模块化后）| 批量插入 1000 条 ≤ 150ms（≥ 10x 提升）|
| LLM API 网络中枢 | `src/adapters/`（claude.ts, gemini.ts, openai.ts）| Goroutine 处理 SSE，不阻塞主线程 |
| 高精度调度器 | `src/task-scheduler.ts` → `src/scheduler/index.ts`（P026）| `robfig/cron` ±1ms 精度（原 ±50ms）|
| 消息路由 | `src/router.ts` | 触发词匹配、群组 JID 路由 |
| gRPC 服务端 | `src/ipc.ts`（文件轮询，P021 已移除 chokidar）| Named Pipe (Win) / Unix Socket (Unix)，RTT ≤ 2ms |

### 🟡 层 3：通用技能沙盒 —— 【TypeScript / Node.js】

**定位**：哑终端执行器，不含调度与路由逻辑。

| 职责 | 来源提案 | 说明 |
| :--- | :--- | :--- |
| NPM 生态执行 | P021 | 继承 `src/sandbox/`（P026 已迁移为 TS）|
| Telegram 增强 | P022 Part A | `/chatid`, `/ping` 命令；媒体消息；@mention 触发；打字状态 |
| Telegram Swarm | P022 Part D | 多 Bot 池 `TELEGRAM_BOT_POOL`；子 Agent 以不同 Bot 身份发言 |
| Claude Code 插件执行 | P023 + P026 | 执行 `.claude/skills/SKILL.md` 中 `scripts/` 下的脚本 |
| MCP 工具注册 | P026 | 将 npm 插件能力注册为 MCP 工具，供 Dart MCP 服务端调度 |
| LLM 降级链 | P021 | pro → flash → lite 三级自动降级 |

---

## 📂 目标目录结构

```
.closeclaw/
├── cmd/                     # 【Dart 控制平面】
│   ├── bin/closeclaw.dart   # 主入口 → dart compile exe
│   ├── lib/core/            # 守护进程、生命周期、审计中继
│   ├── lib/mcp/             # MCP Server (mcp_dart) + Sidecar Client
│   └── lib/skills/          # cc_parser.dart (SKILL.md Progressive Disclosure)
│
├── kernel/                  # 【Go 网络与状态总线】
│   ├── go.mod
│   ├── db/                  # SQLite 封装 (含 schema/messages/groups/tasks/sessions)
│   ├── llm/                 # LLM 适配器池
│   ├── scheduler/           # 高精度任务调度器
│   └── router/              # 消息路由
│
├── skills/                  # 【TypeScript/Node.js 通用技能沙盒】
│   ├── package.json
│   ├── src/
│   │   ├── sandbox/         # SandboxManager + ProcessExecutor (P026 迁移版)
│   │   ├── adapters/        # claude.ts / gemini.ts / openai.ts (P026 迁移版)
│   │   ├── channels/        # TelegramChannel (增强版，含 Swarm)
│   │   └── agent/           # AgentRunner / SandboxRunner
│   └── plugins/             # Claude Code / ClawHub 插件
│
└── proto/                   # 【跨语言协议定义】
    └── messages.proto       # 含强制 trace_id 字段的 Task/Response 结构体
```

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
| **L2 Go 宕机** | Dart 心跳超时 | 自动拉起 `npm start`（P021 TS 单体，含 SQLite 直连）|
| **L3 Dart 宕机** | 手动执行 | 直接 `npm start` → 退化至 P021 基线，所有 TS 功能可用 |

---

## 📊 性能对比矩阵

| 指标 | 当前 TS 单体 | P023 (4语言) | **P027 (3语言)** |
| :--- | :---: | :---: | :---: |
| 启动时间 | 2-3s | <450ms | **<450ms** |
| 消息延迟 | 100-200ms | <30ms | **<35ms** |
| DB 查询 10k | 12ms | 0.6ms | **0.8ms (Go CGO)** |
| 调度精度 | ±50ms | ±1ms | **±1ms** |
| 协作审查率 | 100% | <15% | **>50%** |
| 语言数量 | 1 | 4 | **3** |

---

## ⚠️ 风险评估

| 风险 | 等级 | 缓解措施 |
| :--- | :--- | :--- |
| Windows Named Pipe gRPC 性能 | 中 | POC 阶段实测 RTT，≤2ms 为门控条件 |
| Go CGO Windows 编译（MSYS2）| 中 | 提供预编译二进制 + CI 矩阵（Win/Mac/Linux）|
| Phase 3 先决条件未完成 | 高 | **P026 验收通过是 Phase 2 的硬性前提** |
| Claude Code 插件兼容性 | 低 | `cc_parser.dart` 读取 YAML，TS 侧执行脚本，不改动插件本身 |

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
| `proto/messages.proto` 设计与代码生成 | 共享 |
| Go SQLite WAL 模式性能基准测试 | Go |
| gRPC Named Pipe Windows 跨平台 POC | Go + Dart |
| `dart compile exe` 单文件验证 | Dart |
| `cc_parser.dart` SKILL.md 解析器 | Dart |
| `mcp_dart` MCP 服务端骨架 | Dart |

### Phase 2 — 核心迁移（须 P026 完成，三级决议）

> 将 `src/db.ts`（P026 完成模块化后）、`src/router.ts`、`src/task-scheduler.ts` 分批迁入 `kernel/`。

### Phase 3 — USL 增强（一级决议，可并行）

> Telegram Swarm、ClawHub 动态插件安装、多 LLM 厂商降级链扩展。

---

## 📚 参考提案

| 提案 | 状态 | 关联内容 |
| :--- | :--- | :--- |
| [P020](./proposal-020-architecture-decouple-blueprint.md) | ✅ | 架构解耦蓝图；Phase 3/4 未完成内容由本提案承接 |
| [P021](./proposal-021-phase-0-2-implementation.md) | ✅ | Phase 0-2 实施报告，92 个测试全部通过 |
| [P022](./proposal-022-phase-3-enhancement-migration-performance.md) | ✅ | Telegram 增强 (Part A)、多语言重写目标 (Part C) |
| [P023](./proposal-023-dart-cli-legacy-support.md) | ✅ | Ultra 异构微内核愿景，本提案的精简超集 |
| [P025](./proposal-025-cache-sqlite-statements-all.md) | ✅ | SQLite 预编译缓存（Go 内核已原生支持，可退出 TS 层）|
| [P026](./proposal-026-dart-core-mcp-protocol.md) | ✅ | P020 Phase 3 完成 + MCP 工具注册规范 |

---

## 🗳️ 协作主体投票

| 协作主体 | 态度 | 得分 | 技术理由 |
| :--- | :--- | :--- | :--- |
| **用户** | ✅ 赞同 | +14.5 | 提案发起者。以 Go 替代 Rust 存储内核精简语言栈至 3 种；完整承接 P020 Phase 3/4 未竟事项；纳入 P022 全量 Telegram 增强需求；整合 P026 MCP 协议与 SKILL.md 技能引擎。（用户权重 0.5×29=14.5）|

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
