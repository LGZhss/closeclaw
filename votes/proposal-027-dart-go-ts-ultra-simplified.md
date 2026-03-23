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
│   └── messages.proto            # 含强制 trace_id 字段
│
├── tests/           ✅保留       # 92 个测试（P021 基线），Phase2 后在此继续扩充
├── scripts/         ✅保留       # 18 个核心脚本（已精简）
├── votes/           ✅保留       # 协作治理提案
├── docs/            ✅保留       # 项目文档
├── groups/          ✅保留       # per-group 上下文记忆
├── templates/       ✅保留       # 提案模板
└── .claude/skills/  ✅保留       # Claude Code 技能（cc_parser.dart 扫描此处）
    └── */SKILL.md
```

**图例**：✅保留&nbsp;|&nbsp;❌待迁移&nbsp;|&nbsp;🗑️P026删除&nbsp;|&nbsp;【新增】本提案创建
