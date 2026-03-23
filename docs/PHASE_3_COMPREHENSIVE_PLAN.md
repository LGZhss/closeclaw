# Phase 3 综合实施计划：增强、迁移与性能优化

> **状态**: 📝 规划中  
> **开始日期**: 2026-03-22  
> **基于**: 提案 020 Phase 3 + Telegram 对比分析 + 性能优化研究

---

## 📋 目标

Phase 3 包含三个主要方向：

1. **Telegram Channel 增强** - 借鉴 NanoClaw 的用户体验
2. **TS 全量迁移** - 消灭 JS/TS 混用
3. **性能优化研究** - 识别瓶颈，评估多语言重写可行性

---

## 🎯 Part A: Telegram Channel 增强

### 背景

通过对比 NanoClaw 的 Telegram 实现，发现以下可改进点：

| 功能 | 当前状态 | 目标状态 |
|------|---------|---------|
| Bot 命令 | ❌ 无 | ✅ `/chatid`, `/ping` |
| 媒体消息 | ❌ 忽略 | ✅ 占位符表示 |
| @mention 处理 | ❌ 无 | ✅ 自动转换触发词 |
| 打字状态 | ❌ 无 | ✅ 显示"正在输入" |

### 任务列表

#### A1: 添加 Bot 命令支持

**文件**: `src/channels/telegram.ts`

**新增命令**:
```typescript
// /chatid - 获取当前聊天 ID
bot.command('chatid', (ctx) => {
  const chatId = ctx.chat.id;
  const chatType = ctx.chat.type;
  const chatName = chatType === 'private' 
    ? ctx.from?.first_name 
    : ctx.chat.title;
  ctx.reply(`Chat ID: \`telegram:${chatId}\`\nName: ${chatName}\nType: ${chatType}`);
});

// /ping - 检查机器人状态
bot.command('ping', (ctx) => {
  ctx.reply(`${ASSISTANT_NAME} is online.`);
});
```

**验收标准**:
- [ ] 用户发送 `/chatid` 收到正确的聊天 ID
- [ ] 用户发送 `/ping` 收到在线状态
- [ ] 命令不会被当作普通消息处理

#### A2: 支持媒体消息

**文件**: `src/channels/telegram.ts`

**新增处理**:
```typescript
// 图片
bot.on('message:photo', (ctx) => {
  const caption = ctx.message.caption || '';
  storeMessage(ctx, `[Photo]${caption}`);
});

// 视频
bot.on('message:video', (ctx) => {
  const caption = ctx.message.caption || '';
  storeMessage(ctx, `[Video]${caption}`);
});

// 语音
bot.on('message:voice', (ctx) => {
  storeMessage(ctx, '[Voice message]');
});

// 文档
bot.on('message:document', (ctx) => {
  const name = ctx.message.document?.file_name || 'file';
  storeMessage(ctx, `[Document: ${name}]`);
});
```

**验收标准**:
- [ ] 收到图片时存储 `[Photo]` 占位符
- [ ] 收到视频时存储 `[Video]` 占位符
- [ ] 收到语音时存储 `[Voice message]` 占位符
- [ ] AI 可以看到用户发送了什么类型的内容

#### A3: @mention 自动转换

**文件**: `src/channels/telegram.ts`

**新增逻辑**:
```typescript
// 检测 Telegram @mention 并转换为触发词
const botUsername = ctx.me?.username?.toLowerCase();
if (botUsername) {
  const entities = ctx.message.entities || [];
  const isBotMentioned = entities.some((entity) => {
    if (entity.type === 'mention') {
      const mentionText = content
        .substring(entity.offset, entity.offset + entity.length)
        .toLowerCase();
      return mentionText === `@${botUsername}`;
    }
    return false;
  });
  
  if (isBotMentioned && !TRIGGER_PATTERN.test(content)) {
    content = `@${ASSISTANT_NAME} ${content}`;
  }
}
```

**验收标准**:
- [ ] 群组中 @机器人 自动触发响应
- [ ] 不需要手动输入触发词
- [ ] 与现有触发词机制兼容

#### A4: 打字状态

**文件**: `src/channels/telegram.ts`

**新增方法**:
```typescript
async setTyping(jid: string, isTyping: boolean): Promise<void> {
  if (!this.bot || !isTyping) return;
  try {
    const chatId = this.extractChatId(jid);
    await this.bot.api.sendChatAction(chatId, 'typing');
  } catch (err) {
    log('[Telegram] Failed to send typing indicator', 'DEBUG');
  }
}
```

**验收标准**:
- [ ] AI 回复时显示"正在输入"
- [ ] 不影响消息发送
- [ ] 失败时不抛出错误

### 测试要求

- [ ] 单元测试：Bot 命令处理
- [ ] 单元测试：媒体消息占位符
- [ ] 单元测试：@mention 转换逻辑
- [ ] 集成测试：完整消息流程
- [ ] 手动测试：真实 Telegram Bot 联调

---

## 🎯 Part B: TS 全量迁移

### 待迁移文件（15个）

#### B1: Adapter 层（3个）

| 文件 | 目标 | 优先级 |
|------|------|--------|
| `src/adapters/claude.js` | `src/adapters/claude.ts` | 高 |
| `src/adapters/gemini.js` | `src/adapters/gemini.ts` | 高 |
| `src/adapters/local.js` | `src/adapters/local.ts` | 中 |

**要求**:
1. 实现 `LLMAdapter` 接口
2. 补全类型定义（ChatParams, ChatResponse）
3. 自动注册到 AdapterRegistry
4. 编写单元测试

#### B2: Sandbox 层（2个）

| 文件 | 目标 | 优先级 |
|------|------|--------|
| `src/sandbox/sandboxManager.js` | `src/sandbox/sandboxManager.ts` | 高 |
| `src/sandbox/processExecutor.js` | `src/sandbox/processExecutor.ts` | 高 |

**要求**:
1. 定义 `ISandboxManager` 和 `IProcessExecutor` 接口
2. 补全类型定义
3. 与 `SandboxRunner` 集成
4. 编写单元测试

#### B3: Core 层（6个 - 待废弃）

| 文件 | 处理方式 |
|------|---------|
| `src/core/agentRegistry.js` | 删除（未使用） |
| `src/core/arbitrator.js` | 删除（未使用） |
| `src/core/dispatcher.js` | 删除（未使用） |
| `src/core/session.js` | 删除（未使用） |
| `src/core/skillExecutor.js` | 删除（未使用） |
| `src/core/voter.js` | 删除（未使用） |

**策略**:
1. 评估依赖 - 检查是否有文件引用
2. 迁移功能 - 将必要功能迁移到新架构
3. 删除文件 - 删除所有 core 层文件
4. 更新导入 - 修复所有 import 引用

#### B4: Tools 层（3个）

| 文件 | 目标 | 优先级 |
|------|------|--------|
| `src/tools/cliAnything.js` | `src/tools/cliAnything.ts` | 低 |
| `src/tools/toolDefinitions.js` | `src/tools/toolDefinitions.ts` | 低 |
| `src/tools/toolRegistry.js` | `src/tools/toolRegistry.ts` | 低 |

#### B5: Config（1个）

| 文件 | 处理方式 |
|------|---------|
| `src/config/config.js` | 删除（已合并到 `src/config.ts`） |

### 模块化重构

#### B6: 拆分 db.ts

**目标**: 将 `src/db.ts`（500+ 行）拆分为模块化结构

**建议结构**:
```
src/db/
├── index.ts           # 导出所有模块
├── connection.ts      # 数据库连接和初始化
├── messages.ts        # 消息相关操作
├── groups.ts          # 群组相关操作
├── tasks.ts           # 任务相关操作
├── sessions.ts        # 会话相关操作
└── router-state.ts    # 路由状态相关操作
```

**验收标准**:
- [ ] 文件拆分完成
- [ ] 所有导入更新
- [ ] 所有测试通过
- [ ] TypeScript 编译零错误

#### B7: 重命名 Scheduler

**目标**: 将 `src/task-scheduler.ts` 重构为模块化结构

**建议结构**:
```
src/scheduler/
├── index.ts           # 主入口
├── cron-parser.ts     # Cron 表达式解析
└── task-executor.ts   # 任务执行器
```

### 测试策略

- [ ] 每个迁移的模块都需要单元测试
- [ ] 使用 vitest 编写测试
- [ ] Mock 外部依赖
- [ ] 代码覆盖率 ≥ 80%

---

## 🎯 Part C: 性能优化研究

### 性能瓶颈分析

#### C1: 识别性能密集型模块

通过分析代码和运行时行为，识别以下潜在瓶颈：

| 模块 | 性能特征 | 瓶颈原因 | 优先级 |
|------|---------|---------|--------|
| **Sandbox 执行** | CPU 密集 | 子进程创建、IPC 通信 | 🔴 高 |
| **数据库操作** | I/O 密集 | SQLite 写入、查询 | 🟡 中 |
| **消息路由** | CPU 密集 | 正则匹配、字符串处理 | 🟢 低 |
| **LLM 调用** | 网络 I/O | HTTP 请求、流式响应 | 🟢 低 |
| **日志系统** | I/O 密集 | 文件写入 | 🟢 低 |

#### C2: 性能测试基准

**建立基准测试**:
```typescript
// tests/performance/sandbox-benchmark.test.ts
describe('Sandbox Performance', () => {
  it('should create process in < 100ms', async () => {
    const start = Date.now();
    await sandboxManager.createProcess();
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });
  
  it('should handle 100 concurrent messages', async () => {
    const messages = Array(100).fill(null).map((_, i) => ({
      id: `msg-${i}`,
      text: 'Hello'
    }));
    
    const start = Date.now();
    await Promise.all(messages.map(msg => processMessage(msg)));
    const duration = Date.now() - start;
    
    console.log(`Processed 100 messages in ${duration}ms`);
    expect(duration).toBeLessThan(5000); // 5s for 100 messages
  });
});
```

**测试指标**:
- [ ] 子进程创建时间
- [ ] 消息处理吞吐量
- [ ] 数据库查询延迟
- [ ] 内存使用峰值

### 多语言重写可行性研究

#### C3: Go 重写可行性

**适合 Go 的模块**:

1. **Sandbox Manager** (高优先级)
   - 原因：Go 的 goroutine 比 Node.js 子进程更轻量
   - 优势：更快的进程创建、更低的内存占用
   - 挑战：与 Node.js 的 IPC 通信

2. **CLI 工具** (中优先级)
   - 原因：Go 编译为单一二进制，跨平台部署简单
   - 优势：无需 Node.js 环境，启动速度快
   - 挑战：需要重新实现配置读取

**技术栈**:
```go
// Sandbox Manager (Go)
package sandbox

import (
    "os/exec"
    "encoding/json"
)

type SandboxManager struct {
    maxWorkers int
    pool       chan *Worker
}

func (sm *SandboxManager) Execute(code string) (string, error) {
    cmd := exec.Command("node", "-e", code)
    output, err := cmd.CombinedOutput()
    return string(output), err
}
```

**与 Node.js 集成**:
```typescript
// Node.js 调用 Go 二进制
import { spawn } from 'child_process';

async function executeSandbox(code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('./bin/sandbox-manager', ['--code', code]);
    let output = '';
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`Exit code: ${code}`));
    });
  });
}
```

#### C4: Rust 重写可行性

**适合 Rust 的模块**:

1. **性能关键路径** (高优先级)
   - 消息路由（正则匹配）
   - 数据库操作（SQLite 绑定）
   - 文本处理（Markdown 解析）

2. **CLI 核心** (中优先级)
   - 配置管理
   - 文件系统操作
   - 跨平台兼容性

**技术栈**:
```rust
// Message Router (Rust)
use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct Message {
    id: String,
    text: String,
    chat_jid: String,
}

pub fn route_message(msg: &Message, trigger_pattern: &str) -> bool {
    let re = Regex::new(trigger_pattern).unwrap();
    re.is_match(&msg.text)
}
```

**与 Node.js 集成（NAPI）**:
```typescript
// Node.js 调用 Rust 模块
import { routeMessage } from './native/router.node';

const shouldProcess = routeMessage({
  id: 'msg-1',
  text: '@Andy hello',
  chat_jid: 'telegram:123'
}, '^@Andy\\b');
```

#### C5: 性能对比预估

| 模块 | Node.js | Go | Rust | 推荐 |
|------|---------|----|----|------|
| Sandbox 创建 | 100ms | 10ms | 5ms | Go/Rust |
| 正则匹配 | 1ms | 0.5ms | 0.1ms | Rust |
| SQLite 查询 | 5ms | 3ms | 2ms | Rust |
| HTTP 请求 | 50ms | 40ms | 45ms | Node.js |
| 内存占用 | 50MB | 10MB | 5MB | Rust |

### 实施建议

#### 短期（Phase 3）
1. **建立性能基准** - 测试当前实现的性能
2. **识别瓶颈** - 通过 profiling 找到热点
3. **优化 Node.js 代码** - 先优化现有实现

#### 中期（Phase 4）
1. **Go 重写 Sandbox Manager** - 提升进程创建速度
2. **Go CLI 工具** - 简化部署

#### 长期（Phase 5+）
1. **Rust 重写性能关键路径** - 消息路由、数据库操作
2. **混合架构** - Node.js（业务逻辑）+ Go（并发）+ Rust（性能）

---

## 📅 实施顺序

### 第一阶段（高优先级）- 2 周
1. **Telegram 增强** - Bot 命令、媒体消息、@mention
2. **迁移 Adapter 层** - Claude, Gemini, Local
3. **迁移 Sandbox 层** - SandboxManager, ProcessExecutor

### 第二阶段（中优先级）- 2 周
4. **废弃 Core 层** - 评估依赖 → 迁移功能 → 删除文件
5. **性能基准测试** - 建立测试套件
6. **性能瓶颈分析** - Profiling + 报告

### 第三阶段（低优先级）- 2 周
7. **迁移 Tools 层** - cliAnything, toolDefinitions, toolRegistry
8. **模块化 db.ts** - 拆分为多个模块
9. **重命名 Scheduler** - 重构为模块化结构

### 第四阶段（研究）- 持续
10. **Go/Rust 可行性研究** - POC 实现
11. **性能对比测试** - Node.js vs Go vs Rust
12. **提案准备** - 多语言重写提案（需三级决议）

---

## ⚠️ 风险与注意事项

### 风险
1. **Telegram 增强可能引入新 Bug** - 需要充分测试
2. **TS 迁移可能破坏类型兼容** - 保持接口签名不变
3. **性能优化可能引入复杂性** - 先测量再优化
4. **多语言重写增加维护成本** - 需要团队技能支持

### 缓解措施
1. **逐步迁移** - 一次迁移一个模块
2. **充分测试** - 每次迁移后运行完整测试套件
3. **性能基准** - 建立基准后再优化
4. **提案流程** - 多语言重写需要走三级决议

---

## 🎯 成功标准

Phase 3 完成的标准：
- [ ] Telegram Channel 支持 Bot 命令、媒体消息、@mention
- [ ] 所有 JS 文件已迁移或删除
- [ ] TypeScript 编译零错误
- [ ] 所有测试通过（包括新增测试）
- [ ] 代码覆盖率 ≥ 80%
- [ ] 性能基准测试建立
- [ ] 性能瓶颈分析报告完成
- [ ] Go/Rust 可行性研究报告完成

---

## 📚 参考资料

- [提案 020 - 架构解耦蓝图](../votes/proposal-020-architecture-decouple-blueprint.md)
- [Telegram 实现对比](./TELEGRAM_IMPL_COMPARISON.md)
- [NanoClaw vs CloseClaw 对比](./NANOCLAW_VS_CLOSECLAW.md)
- [Phase 1 实施总结](../.kiro/specs/phase-1-agent-execution-chain/IMPLEMENTATION_SUMMARY.md)
- [Phase 2 实施总结](../.kiro/specs/phase-2-telegram-channel/IMPLEMENTATION_SUMMARY.md)

---

## 📝 提案准备

### 多语言重写提案（待发起）

**提案级别**: 三级（核心架构/重大变更）

**提案内容**:
1. 性能瓶颈分析报告
2. Go/Rust POC 实现
3. 性能对比测试结果
4. 维护成本评估
5. 团队技能评估
6. 实施路线图

**投票要求**: ≥ 8 个协作主体 + 用户投票

**注意**: 多语言重写是重大架构变更，必须走提案流程，不能直接实施。
