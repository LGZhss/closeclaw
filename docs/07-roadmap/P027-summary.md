# P027 通过总结 - 三语言异构微内核架构

> **提案 ID**: 027  
> **通过日期**: 2026-03-24  
> **提案级别**: 二级决议  
> **状态**: ✅ 已通过  

---

## 📊 投票结果

| 项目 | 结果 |
|------|------|
| 协作主体票数 (n=6) | +6 (全票通过) |
| 用户得分 (±0.5×3) | +1.5 |
| **综合总得分** | **+7.5** |
| 反对票数量 | 0 |
| 法定人数 (二级需 ≥5) | 6/5 ✅ 已达标 |

---

## 🏗️ 核心变更

### 语言栈精简
- **原方案 (P023)**: 4 语言 (Dart + Rust + Go + TS)
- **新方案 (P027)**: 3 语言 (Dart + Go + TS)
- **关键决策**: 以 `mattn/go-sqlite3` 替代 Rust `rusqlite` 存储内核

### 架构分层

```
┌─────────────────────────────────────┐
│ 层 1: 控制平面 (Dart)                │
│ - 守护进程 & 用户交互 CLI            │
│ - MCP Server (mcp_dart)              │
│ - SKILL.md 解析器                    │
│ - TraceID 生成与审计中继             │
└─────────────────────────────────────┘
          ↓ (gRPC Named Pipe / Stdio MCP)
┌─────────────────────────────────────┐
│ 层 2: 网络与状态总线 (Go)            │
│ - go-sqlite3 (极速内存级总线)        │
│ - LLM API 网络中枢 (Goroutine SSE)   │
│ - 毫秒级任务调度器 (robfig/cron)     │
│ - 消息路由与触发词匹配               │
└─────────────────────────────────────┘
          ↓ (Named Pipe / IPC)
┌─────────────────────────────────────┐
│ 层 3: 哑终端沙盒 (TypeScript)        │
│ - NPM 生态执行器                     │
│ - Telegram 增强 (Bot 命令/Swarm 池)   │
│ - MCP 工具注册桥接                   │
│ - LLM 三级降级链                    │
└─────────────────────────────────────┘
```

---

## 🎯 Phase 1 POC 验收标准

### 性能门控
- [ ] Windows Named Pipe gRPC RTT ≤ 2ms (100 次连续测试平均值)
- [ ] Go SQLite 批量插入 1000 条 ≤ 150ms
- [ ] Go Scheduler 精度实测 ≤ ±5ms

### 功能验证
- [ ] `proto/messages.proto` 含 `trace_id` 字段，三侧均生成桩代码
- [ ] `dart compile exe` 在 Windows 生成单文件并成功执行 `closeclaw doctor`
- [ ] 零改动加载并成功执行一个 `.claude/skills/SKILL.md` 插件

---

## 📈 性能对比

| 指标 | TS 单体 | P023 (4 语言) | **P027 (3 语言)** |
|------|---------|---------------|-------------------|
| 启动时间 | 2-3s | <450ms | **<450ms** |
| 消息延迟 | 100-200ms | <30ms | **<35ms** |
| DB 10k 查询 | 12ms | 0.6ms (Rust) | **0.8ms (Go)** |
| 调度精度 | ±50ms | ±1ms | **±1ms** |
| 协作审查率 | 100% | <15% | **>50%** |

---

## 🔒 三级容灾降级策略

| 级别 | 触发条件 | 行为 |
|------|----------|------|
| **L1 正常态** | Dart+Go+TS 全部存活 | 三层完整运行 |
| **L2 Go 宕机** | Dart 心跳超时 | 自动拉起 `npm start` (P021 基线) |
| **L3 Dart 宕机** | 手动执行 | 直接 `npm start` → 退化至 P021 基线 |

---

## 📋 下一步行动

### 立即行动项
1. ✅ 更新提案状态为"已通过"
2. ✅ 同步文档 (future-plan.md, overview.md)
3. ⏳ 创建 P027 实施 worktree

### Phase 1 实施准备
```bash
# 创建工作树
git worktree add ../worktrees/proposal-027 -b proposal/027

# 进入目录
cd ../worktrees/proposal-027

# 开始实施
# 1. 创建 proto/messages.proto
# 2. 实现 gRPC Named Pipe POC
# 3. 编写基准测试脚本
# 4. 验证 Dart AOT 编译
```

---

## 📚 相关提案

| 提案 | 状态 | 关联内容 |
|------|------|----------|
| [P020](./proposal-020-architecture-decouple-blueprint.md) | ✅ | 解耦蓝图 |
| [P021](./proposal-021-phase-0-2-implementation.md) | ✅ | Phase 0-2 报告，92 测试通过 |
| [P022](./proposal-022-phase-3-enhancement-migration.md) | ✅ | Telegram 增强 |
| [P023](./proposal-023-dart-cli-legacy-support.md) | ✅ | 四语言微内核愿景 |
| [P026](./proposal-026-dart-core-mcp-protocol.md) | ✅ | MCP 协议 + TS 全量迁移 |
| **P027** | **✅ 已通过** | **三语言精简方案** |

---

## 🎉 里程碑意义

P027 的通过标志着 CloseClaw 正式确立了**务实、可执行的三语言异构微内核架构**：

1. **降低协作门槛**: 从 4 语言精简至 3 语言，协作审查率预期从 <15% 提升至 >50%
2. **性能与可维护性平衡**: Go SQLite 仅损失约 25% 性能 (0.6ms → 0.8ms)，但大幅降低学习曲线
3. **渐进式演进路径**: Phase 1 POC → Phase 2 核心迁移 → Phase 3 USL 增强，每步都有明确验收标准
4. **容灾韧性保障**: L1-L3 三级降级策略确保 P021 TS 基线始终可用

---

> **CloseClaw - 公平、透明、高效的多智能体协作** 🚀  
> **三语言架构正式启航！** 
