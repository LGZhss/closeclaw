# Phase 3: Telegram 增强、TS 迁移与多语言重写

> **提案 ID**: 022  
> **提案级别**: 三级（核心架构/多语言重写）  
> **发起者**: Kiro  
> **发起日期**: 2026-03-22  
> **状态**: 🟡 投票中

---

## 📋 提案背景

Phase 0-2 已成功完成：
- ✅ Phase 0: 关键 Bug 修复（B1-B3, C5, C7）
- ✅ Phase 1: Agent 执行链路打通
- ✅ Phase 2: Telegram Channel 基础实现

### 性能瓶颈分析

通过详细分析（详见 `docs/PHASE_3_COMPREHENSIVE_PLAN.md`），识别出以下性能瓶颈：

| 模块 | 当前状态 | 性能问题 | 优先级 |
|------|---------|---------|--------|
| **src/db.ts** | 12.8KB TypeScript | 运行时开销、类型转换、GC | ⭐⭐⭐⭐⭐ |
| **src/task-scheduler.ts** | Cron 解析混乱 | setInterval 精度 ±50ms | ⭐⭐⭐ |
| **src/index.ts** | 消息主循环 | 轮询效率低 | ⭐⭐ |

### 性能收益预估

| 指标 | 当前 (TS) | Rust/Go 改写后 | 提升 |
|------|----------|---------------|------|
| 消息处理延迟 | 100-200ms | 20-40ms | **5-10x** |
| DB 查询 | 0.8-12ms | 0.05-0.6ms | **16-20x** |
| 调度精度 | ±50ms | ±1ms | **50x** |
| CPU 占用 | 2-5% | 0.1-0.5% | **10-50x** |
| 内存占用 | 120-150MB | 30-50MB | **3-5x** |
| 启动时间 | 2-3s | 200-400ms | **5-10x** |

---

## 🎯 提案目标

### 目标 1: Telegram Channel 增强（一级决议）

**新增功能**:
1. Bot 命令支持（`/chatid`, `/ping`）
2. 媒体消息支持（图片、视频、语音等）
3. @mention 自动转换为触发词
4. 打字状态显示

### 目标 2: TS 全量迁移（二级决议）

**迁移范围**:
- Adapter 层（3 个 JS 文件）
- Sandbox 层（2 个 JS 文件）
- Tools 层（3 个 JS 文件）
- 废弃 Core 层（6 个未使用文件）
- 删除重复 Config（1 个文件）

### 目标 3: 多语言重写（三级决议）

**采用方案 B：完整改写**

```
┌─────────────────────────────────────────────────────────────┐
│                      整体架构                                │
├─────────────────────────────────────────────────────────────┤
│  TypeScript (业务逻辑)                                       │
│  - adapters/ (LLM 调用)                                      │
│  - channels/ (消息通道)                                      │
│  - agent/ (Agent 执行)                                       │
│  - skills/ (技能系统)                                        │
└─────────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
         │                    │                    │
    IPC (gRPC)           IPC (gRPC)          IPC (gRPC)
         │                    │                    │
    ┌────┴────┐          ┌────┴────┐         ┌────┴────┐
    │ Rust    │          │ Go      │         │ 保留    │
    │ 模块    │          │ 模块    │         │ TS      │
    ├─────────┤          ├─────────┤         ├─────────┤
    │ db.ts   │          │ task-   │         │ config  │
    │ index   │          │ scheduler│        │ logger  │
    │ ipc.ts  │          │ router  │         │ types   │
    └─────────┘          └─────────┘         └─────────┘
```

#### 3.1 Rust 重写模块（最高优先级）

**src/db.ts → Rust**

| 性能瓶颈 | 当前实现 | Rust 改写收益 |
|---------|---------|--------------|
| 消息插入 | 1.5ms/条 | **0.15ms/条 (10x)** |
| 批量 1000 条 | 1500ms | **120ms (12x)** |
| 查询 100 行 | 0.8ms | **0.05ms (16x)** |
| 查询 10000 行 | 12ms | **0.6ms (20x)** |

**技术方案**:
```rust
// src/db/src/lib.rs
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct DbMessage {
    pub id: i64,
    pub chat_jid: String,
    pub sender: String,
    pub content: String,
    pub timestamp: String,
    pub is_from_me: bool,
    pub is_group: bool,
    pub processed: bool,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(path: &str) -> Result<Self, rusqlite::Error> {
        let conn = Connection::open(path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL;")?;
        Ok(Self { conn })
    }

    pub fn insert_message(&self, msg: &DbMessage) -> Result<i64, rusqlite::Error> {
        self.conn.execute(
            "INSERT INTO messages (chat_jid, sender, content, timestamp, is_from_me, is_group, processed) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                msg.chat_jid,
                msg.sender,
                msg.content,
                msg.timestamp,
                msg.is_from_me as i32,
                msg.is_group as i32,
                msg.processed as i32,
            ],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_unprocessed(&self, limit: i64) -> Result<Vec<DbMessage>, rusqlite::Error> {
        let mut stmt = self.conn.prepare(
            "SELECT id, chat_jid, sender, content, timestamp, is_from_me, is_group, processed 
             FROM messages WHERE processed = 0 ORDER BY id LIMIT ?1"
        )?;
        
        let rows = stmt.query_map([limit], |row| {
            Ok(DbMessage {
                id: row.get(0)?,
                chat_jid: row.get(1)?,
                sender: row.get(2)?,
                content: row.get(3)?,
                timestamp: row.get(4)?,
                is_from_me: row.get::<_, i32>(5)? != 0,
                is_group: row.get::<_, i32>(6)? != 0,
                processed: row.get::<_, i32>(7)? != 0,
            })
        })?;
        
        rows.collect()
    }
}
```

**与 Node.js 集成**:
```typescript
// src/db/index.ts (NAPI 桥接)
import { Database } from './native/db.node';

const db = new Database('./store/messages.db');

export function insertMessage(msg: DbMessage): number {
  return db.insert_message(msg);
}

export function getUnprocessedMessages(limit: number): DbMessage[] {
  return db.get_unprocessed(limit);
}
```

**src/index.ts (消息主循环) → Rust**

| 性能瓶颈 | 当前实现 | Rust 改写收益 |
|---------|---------|--------------|
| 100 条消息处理 | 45ms | **8ms (5-6x)** |

**src/ipc.ts → Rust**
- 文件系统 IPC
- 与 Agent Runner 通信

#### 3.2 Go 重写模块（第二优先级）

**src/task-scheduler.ts → Go**

| 性能瓶颈 | 当前实现 | Go 改写收益 |
|---------|---------|-------------|
| 调度精度 | ±50ms | **±1ms (50x)** |
| CPU 占用 | 2-3% | **0.1% (20-30x)** |

**技术方案**:
```go
// cmd/scheduler/main.go
package main

import (
    "github.com/robfig/cron/v3"
    "github.com/closeclaw/scheduler/pkg"
)

type Scheduler struct {
    cron     *cron.Cron
    executor *pkg.TaskExecutor
}

func NewScheduler() *Scheduler {
    return &Scheduler{
        cron:     cron.New(cron.WithSeconds()),
        executor: pkg.NewTaskExecutor(),
    }
}

func (s *Scheduler) AddTask(spec string, task pkg.Task) error {
    _, err := s.cron.AddFunc(spec, func() {
        s.executor.Execute(task)
    })
    return err
}

func (s *Scheduler) Start() {
    s.cron.Start()
}

func (s *Scheduler) Stop() {
    s.cron.Stop()
}
```

**src/router.ts (消息路由) → Go**

| 性能瓶颈 | 当前实现 | Go 改写收益 |
|---------|---------|-------------|
| 正则匹配 | 1ms | **0.5ms (2x)** |
| 消息路由 | 复杂 | **更高效的事件分发** |

---

## � 目标 4: Telegram Swarm 支持（可选扩展）

### 背景

参考 [NanoClaw Telegram Swarm](https://nanoclaw.dev/skills/telegram-swarm) 实现：

> 当 Agent 创建团队（Team）处理复杂任务时，每个子 agent 在 Telegram 群组中显示为不同的 bot，方便区分谁在说话。

### 功能描述

1. **多 bot 架构**
   - 主 bot：接收消息，发送主 agent 响应
   - Pool bots：轻量级发送 bot，用于子 agent 消息

2. **sender 参数支持**
   - `send_message` 工具接受 `sender` 参数
   - 根据 sender 名称分配 pool bot
   - 群组中显示不同 bot 的消息

3. **Bot 池管理**
   - 3-5 个 pool bots 足够
   - 映射：{groupFolder}:{senderName}
   - 轮询分配超出池大小的 sender

### 架构可行性分析

| 组件 | 当前状态 | 需要改动 |
|------|---------|---------|
| TelegramChannel | 已实现 | 添加 pool bot 支持 |
| send_message 工具 | 基础实现 | 添加 sender 参数 |
| Agent Teams | 未实现 | 新增模块 |
| 环境变量 | TELEGRAM_TOKEN | 添加 TELEGRAM_BOT_POOL |

### 实施建议

**如果提案通过**，可以将 Telegram Swarm 作为 Phase 3 的可选扩展任务。

---

## ⚠️ 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| Rust NAPI 编译问题 | 中 | 使用 napi-rs 框架，预先测试 |
| Go 与 Node.js IPC 延迟 | 中 | 使用 gRPC + Unix Socket |
| TS 迁移破坏类型兼容 | 中 | 保持接口签名不变 |
| 多语言增加维护成本 | 高 | 明确模块边界，减少跨语言调用 |

---

## 🎯 验收标准

### Part A: Telegram 增强

- [ ] `/chatid` 命令返回正确的聊天 ID
- [ ] `/ping` 命令返回在线状态
- [ ] 收到图片时存储 `[Photo]` 占位符
- [ ] 群组中 @机器人 自动触发响应
- [ ] AI 回复时显示"正在输入"
- [ ] 所有新功能有单元测试

### Part B: TS 全量迁移

- [ ] 所有 JS 文件已迁移或删除
- [ ] TypeScript 编译零错误
- [ ] 所有测试通过
- [ ] 代码覆盖率 ≥ 80%

### Part C: 多语言重写

- [ ] Rust db 模块性能提升 ≥ 10x
- [ ] Go scheduler 调度精度 ≤ ±5ms
- [ ] 消息处理延迟 ≤ 50ms
- [ ] 内存占用 ≤ 80MB
- [ ] 启动时间 ≤ 1s
- [ ] 与 Node.js 集成测试通过

---

## 📊 性能目标

| 指标 | 当前值 | 目标值 | 验证方法 |
|------|--------|--------|---------|
| 消息处理延迟 | 100-200ms | ≤50ms | 基准测试 |
| DB 查询 (100行) | 0.8ms | ≤0.1ms | 基准测试 |
| 调度精度 | ±50ms | ≤±5ms | 日志时间戳 |
| CPU 占用 (idle) | 2-5% | ≤1% | top/htop |
| 内存占用 | 120-150MB | ≤80MB | process.memory() |
| 启动时间 | 2-3s | ≤1s | time npm start |

---

## 📚 参考资料

- [提案 020 - 架构解耦蓝图](./proposal-020-architecture-decouple-blueprint.md)
- [提案 021 - Phase 0-2 实施](./proposal-021-phase-0-2-implementation.md)
- [Telegram 实现对比](../docs/TELEGRAM_IMPL_COMPARISON.md)
- [Phase 3 综合计划](../docs/PHASE_3_COMPREHENSIVE_PLAN.md)
- [NanoClaw vs CloseClaw 对比](../docs/NANOCLAW_VS_CLOSECLAW.md)
- [NanoClaw Telegram Swarm](https://nanoclaw.dev/skills/telegram-swarm)

---

## 🗳️ 协作主体投票

| 协作主体 | 态度 | 得分 | 技术理由 |
| :--- | :--- | :--- | :--- |
| Kiro | ✅ 赞同 | +1 | 发起者。性能分析显示 db.ts 是最大瓶颈，改写收益 10-20x。方案 B 完整改写 ROI 最高。Telegram Swarm 可作为可选扩展。风险可控：分阶段实施，每阶段可回滚。 |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| **用户** | | | |

---

## 📝 投票说明

### 决议级别

本提案为**三级决议**（核心架构/多语言重写），因为：
- 引入 Rust 和 Go 两种新语言
- 改变核心模块架构
- 影响整个技术栈

### 投票要求

- ≥ 8 个协作主体投票
- 用户投票
- 赞同票 > 反对票

---

## 💰 商业价值

改写后的系统可支持：

| 指标 | 当前 | 改写后 | 提升 |
|------|------|--------|------|
| 并发用户 | 10-50 | 100-500 | **10x** |
| 消息吞吐 | 100/秒 | 1000/秒 | **10x** |
| 冷启动 | 2-3s | ≤1s | **3x** |
| 运营成本 | 1x | 0.3x | **70%↓** |

---

> **最终决议**: 🟡 投票中
>
> 请各协作主体在上方投票表中填写态度、得分和技术理由。