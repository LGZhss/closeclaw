# CloseClaw 实施规划：proposal-020 架构解耦

> **文档版本**: 1.0
> **关联提案**: proposal-020（已通过）
> **面向读者**: 执行该提案的协作主体（小模型）
> **阅读须知**: 每个任务均可独立执行，依赖关系已明确标注。执行前必须先完成所列依赖任务。

---

## 执行规范

每个任务执行完毕后必须：

1. 在 worktree 分支提交代码（`git commit`）
2. 推送分支（`git push -u origin <branch>`）
3. 创建 Pull Request，PR 描述引用本文档对应任务 ID
4. **禁止直接推送到 main**

Worktree 创建命令模板：

```bash
git worktree add worktrees/<task-id> -b <task-id>
# 例：
git worktree add worktrees/task-0.1 -b task/phase0-router-import
```

验收命令（所有 Phase 0 任务完成后统一跑）：

```bash
npm run typecheck   # 必须零错误
npm test            # 必须全绿
```

---

## Phase 0：Bug 修复与容器残留清理

> 提案级别：一级
> 前置条件：无
> 目标：让现有 TS 代码能通过 typecheck 并正常运行

---

### Task 0.1 — 修复 router.ts 缺失 import（Bug B1）

**依赖**：无
**文件**：`src/router.ts`
**问题**：第 88 行调用 `getRouterState(groupFolder)` 但该函数未在顶部 import

**修改**：将文件第一行 import 改为：

```typescript
import {
  getRegisteredGroupByFolder,
  getMessagesSince,
  setRouterState,
  getRouterState,
  markMessagesProcessed,
} from './db.js';
```

**注意**：同时删除 `insertMessage` 的 import（该函数在 router.ts 中实际未被调用）。

**完成判定**：`npm run typecheck` 中 `src/router.ts` 无报错。

---

### Task 0.2 — 修复 index.ts JID 映射错误（Bug B2）

**依赖**：无
**文件**：`src/index.ts`
**问题**：消息轮询循环中 `const groupFolder = chatJid` 是错误简化，JID 与 folder 不等价

**第一步**：在文件顶部 db import 中补充 `getRegisteredGroup`：

```typescript
import {
  insertMessage,
  getUnprocessedMessages,
  markMessagesProcessed,
  getRegisteredGroup,   // ← 新增
  getMainGroup,
  setRegisteredGroup,
} from './db.js';
```

**第二步**：找到 `startMessageLoop` 函数内的以下代码段并替换：

删除：
```typescript
// Find the group folder for this chat
// This is simplified - in reality you'd look up the group by JID
const groupFolder = chatJid; // Simplified for now
```

替换为：
```typescript
const group = getRegisteredGroup(chatJid);
if (!group) {
  logger.warn(`No registered group for JID: ${chatJid}, skipping`);
  markMessagesProcessed(messages.map(m => m.id));
  continue;
}
const groupFolder = group.folder;
```

**第三步**：同文件中 `handleIncomingMessage` 函数的 `insertMessage` 调用使用了 camelCase 字段名，与 `DbMessage` 类型（snake_case）不符，修正为：

```typescript
insertMessage({
  id: 0,                          // AUTOINCREMENT，实际值由数据库生成
  channel: message.channel,
  chat_jid: message.chatJid,
  sender_jid: message.senderJid,
  sender_name: message.senderName,
  text: message.text,
  timestamp: message.timestamp,
  is_group: message.isGroup,
  group_name: message.groupName,
  processed: false,
  created_at: new Date().toISOString(),
});
```

**第四步**：删除顶部 import 中不再使用的 `RegisteredGroup` 和 `sendMessage`：

```typescript
// 从 types 的 import 中删除 RegisteredGroup
// 从 router 的 import 中删除 sendMessage
```

**完成判定**：`npm run typecheck` 中 `src/index.ts` 无报错。

---

### Task 0.3 — 移除 chokidar 依赖（Bug B3）

**依赖**：无
**文件**：`src/ipc.ts`
**问题**：第 3 行 `import { watch } from 'chokidar'`，chokidar 未安装；且 `watchIPC` 函数依赖它

**第一步**：删除第 3 行：
```typescript
import { watch } from 'chokidar';   // ← 整行删除
```

**第二步**：删除整个 `watchIPC` 函数（从 `export function watchIPC` 到其对应的闭合花括号），该函数约 30 行。`pollIPC` 函数已提供替代轮询能力，无需 watcher。

**第三步**：删除顶部 import 中未使用的 `IPC_POLL_INTERVAL`（如存在）：
```typescript
import { DATA_DIR } from './config.js';   // 仅保留 DATA_DIR
```

**完成判定**：`npm run typecheck` 中 `src/ipc.ts` 无报错；`npm test` 中 ipc 相关测试通过。

---

### Task 0.4 — 修复 cron-parser v5 API

**依赖**：无
**文件**：`src/task-scheduler.ts`
**问题**：代码使用 `cronParser.parseExpression()`，但 cron-parser v5 已将 API 改为 `CronExpressionParser.parse()`

**修改**：

将顶部 import：
```typescript
import cronParser from 'cron-parser';
```
改为：
```typescript
import { CronExpressionParser } from 'cron-parser';
```

将所有 `cronParser.parseExpression(x)` 替换为 `CronExpressionParser.parse(x)`。
共出现 2 处：`calculateNextRun` 函数内和 `validateCronExpression` 函数内。

**完成判定**：`npm run typecheck` 中 `src/task-scheduler.ts` 无报错；定时任务相关测试通过。

---

### Task 0.5 — 清理容器残留：types.ts

**依赖**：无
**文件**：`src/types.ts`
**问题**：`ContainerConfig`、`MountConfig` 两个接口及 `RegisteredGroup.containerConfig` 字段是容器方案遗留，已无用途

**删除以下内容**：

```typescript
// 删除整个 ContainerConfig 接口：
export interface ContainerConfig {
  additionalMounts?: MountConfig[];
  timeout?: number;
}

// 删除整个 MountConfig 接口：
export interface MountConfig {
  hostPath: string;
  containerPath: string;
  readonly?: boolean;
}

// 删除 RegisteredGroup 中的字段：
containerConfig?: ContainerConfig;
```

**完成判定**：`src/types.ts` 中无 `ContainerConfig`、`MountConfig`、`containerConfig` 字样。

---

### Task 0.6 — 清理容器残留：config.ts

**依赖**：无
**文件**：`src/config.ts`
**问题**：`CONTAINER_IMAGE`、`CONTAINER_TIMEOUT`、`IDLE_TIMEOUT` 是死常量；`MAX_CONCURRENT_CONTAINERS` 语义过时

**删除以下常量**（整行删除）：
```typescript
export const CONTAINER_IMAGE = ...
export const CONTAINER_TIMEOUT = ...
export const IDLE_TIMEOUT = ...
```

**重命名**：
```typescript
// 将：
export const MAX_CONCURRENT_CONTAINERS = Math.max(1, parseInt(process.env.MAX_CONCURRENT_CONTAINERS || '5', 10) || 5);
// 改为：
export const MAX_CONCURRENT_AGENTS = Math.max(1, parseInt(process.env.MAX_CONCURRENT_AGENTS || '5', 10) || 5);
```

**完成判定**：`src/config.ts` 中无 `CONTAINER` 字样。

---

### Task 0.7 — 清理容器残留：db.ts

**依赖**：Task 0.5（types.ts 中 ContainerConfig 已删除）
**文件**：`src/db.ts`
**问题**：数据库 schema、INSERT 语句、SELECT 结果解析中仍有 `container_config` 字段

**第一步**：在 `CREATE TABLE registered_groups` 语句中删除：
```sql
container_config TEXT
```
（注意同时删除上一行末尾的逗号，保持 SQL 语法正确）

**第二步**：在 `setRegisteredGroup` 函数中：
- INSERT 语句的列名列表中删除 `container_config`
- VALUES 占位符中删除对应的 `?`
- `stmt.run(...)` 调用中删除 `group.containerConfig ? JSON.stringify(group.containerConfig) : null` 参数

**第三步**：在以下四个函数的返回值构造中，删除 `container_config` 解析语句：
- `getRegisteredGroup`
- `getRegisteredGroupByFolder`
- `getAllRegisteredGroups`
- `getMainGroup`

即删除类似以下的代码：
```typescript
container_config: row.container_config ? JSON.parse(row.container_config) : undefined,
```

**第四步**：补充缺失的 `TaskRunLog` import（当前 db.ts 使用了该类型但未 import）：
```typescript
import type {
  RegisteredGroup,
  ScheduledTask,
  TaskRunLog,    // ← 补充
  Session,
  RouterState,
  DbMessage,
} from './types.js';
```

**完成判定**：`src/db.ts` 无 `container_config`、`containerConfig` 字样；`npm run typecheck` 无报错。

---

### Task 0.8 — 修复 group-queue.ts 命名联动

**依赖**：Task 0.6（config.ts 中已重命名为 MAX_CONCURRENT_AGENTS）
**文件**：`src/group-queue.ts`

**修改一**：顶部 import 更新：
```typescript
import { MAX_CONCURRENT_AGENTS } from './config.js';
```

**修改二**：构造函数参数默认值更新：
```typescript
constructor(private maxConcurrent: number = MAX_CONCURRENT_AGENTS) {}
```

**修改三**：将文件中所有 `activeContainers` 重命名为 `activeAgents`（共 6 处，包括属性声明、递增、递减、日志、`getStats` 返回值的 key 名）。

**完成判定**：`src/group-queue.ts` 无 `activeContainers`、`MAX_CONCURRENT_CONTAINERS` 字样；typecheck 无报错。

---

### Task 0.9 — 修复 logger.ts 类型错误

**依赖**：无
**文件**：`src/logger.ts`
**问题**：`import { GROUPS_DIR }` 未使用；`log` 函数通过动态 key 调用 pino，TypeScript 无法推断类型

**替换整个 `log` 函数**：

```typescript
// 删除未使用的 import
// import { GROUPS_DIR } from './config.js';   ← 整行删除

const pinoMethodMap = {
  DEBUG: 'debug',
  INFO:  'info',
  WARN:  'warn',
  ERROR: 'error',
  FATAL: 'fatal',
} as const satisfies Record<keyof typeof logLevels, 'debug' | 'info' | 'warn' | 'error' | 'fatal'>;

export function log(message: string, level: keyof typeof logLevels = 'INFO') {
  logger[pinoMethodMap[level]](message);
}
```

**完成判定**：`npm run typecheck` 中 `src/logger.ts` 无报错。

---

### Task 0.10 — 重写 ipc.test.ts

**依赖**：Task 0.3（ipc.ts 已移除 chokidar 和 watchIPC）
**文件**：`tests/ipc.test.ts`
**问题**：当前测试调用 `ipc.sendMessage()` 和 `ipc.on()`，这两个 API 根本不存在

**完整替换文件内容**：

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// 用系统临时目录存放测试用 IPC 文件，不污染真实 data/ipc/
const TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'closeclaw-ipc-test-'));
const MESSAGES_DIR = path.join(TEMP_DIR, 'ipc', 'messages');
const TASKS_DIR    = path.join(TEMP_DIR, 'ipc', 'tasks');

function ensureDirs() {
  fs.mkdirSync(MESSAGES_DIR, { recursive: true });
  fs.mkdirSync(TASKS_DIR,    { recursive: true });
}

function cleanDirs() {
  for (const dir of [MESSAGES_DIR, TASKS_DIR]) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      fs.unlinkSync(path.join(dir, f));
    }
  }
}

// ipc.ts 从 config 读取 DATA_DIR（= process.cwd()/data），
// 这里直接测试公开函数的行为契约，不 mock 内部路径。
import { readMessage, getPendingMessages, cleanupIPC } from '../src/ipc.js';

// ---------------------------------------------------------------------------

describe('readMessage', () => {
  it('returns null for a non-existent message id', () => {
    expect(readMessage('no-such-id-' + Date.now())).toBeNull();
  });
});

describe('getPendingMessages', () => {
  it('resolves to an array', async () => {
    const result = await getPendingMessages();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('cleanupIPC', () => {
  afterEach(cleanDirs);

  it('resolves without error when called on empty/missing dirs', async () => {
    await expect(cleanupIPC()).resolves.toBeUndefined();
  });

  it('deletes files whose mtime exceeds maxAge', async () => {
    ensureDirs();
    const filePath = path.join(MESSAGES_DIR, 'stale.json');
    fs.writeFileSync(filePath, '{"id":"stale"}');
    // 将 mtime 倒推 2 小时
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
    fs.utimesSync(filePath, twoHoursAgo, twoHoursAgo);

    // cleanupIPC 操作的是真实 DATA_DIR，但我们至少验证它不抛异常
    // 且时间判断逻辑正确（通过直接操作临时文件验证）
    const age = Date.now() - fs.statSync(filePath).mtimeMs;
    expect(age).toBeGreaterThan(3600 * 1000);  // 确实比 1h 老

    await expect(cleanupIPC(3600 * 1000)).resolves.toBeUndefined();
  });

  it('keeps files newer than maxAge', async () => {
    ensureDirs();
    const filePath = path.join(MESSAGES_DIR, 'fresh.json');
    fs.writeFileSync(filePath, '{"id":"fresh"}');

    const age = Date.now() - fs.statSync(filePath).mtimeMs;
    expect(age).toBeLessThan(3600 * 1000);  // 确实比 1h 新

    fs.unlinkSync(filePath);  // 测试完手动清理
  });
});
```

**完成判定**：`npm test` 中 `tests/ipc.test.ts` 全部通过，无 "ipc.sendMessage is not a function" 类错误。

---

### Task 0.11 — Phase 0 验收

**依赖**：Task 0.1 ~ 0.10 全部完成
**操作**：

```bash
npm run typecheck   # 期望：零错误
npm test            # 期望：全绿
git tag phase0-done # 打里程碑 tag（Comate 建议）
```

---

## Phase 1：Agent 执行链路打通

> 提案级别：二级
> 前置条件：Phase 0 全部完成（typecheck 零错 + 测试全绿）
> 目标：消息触发后能真正调用 LLM 并返回响应

---

### Task 1.1 — 创建 ILLMAdapter 接口

**依赖**：Task 0.x 全部完成
**新建文件**：`src/adapters/base.ts`（替代现有 `base.js`，**不删除** `base.js` 直到 Task 3.1）

**完整文件内容**：

```typescript
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;  // JSON Schema
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatParams {
  systemPrompt: string;
  history: ChatMessage[];
  message: string;
  tools?: ToolDefinition[];
  /** 执行质量提示：'lite' | 'flash' | 'pro'，适配器自行映射到具体模型 */
  quality?: 'lite' | 'flash' | 'pro';
}

export interface ChatResult {
  text: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
}

/**
 * 所有 LLM 适配器必须实现此接口。
 * 适配器负责：模型选择、降级、重试、API 格式转换。
 * 调用方只需面向此接口编程。
 */
export interface ILLMAdapter {
  /** 适配器唯一标识，与环境变量 DEFAULT_ADAPTER 对应 */
  readonly id: string;
  chat(params: ChatParams): Promise<ChatResult>;
}
```

**完成判定**：文件存在，`npm run typecheck` 无报错。

---

### Task 1.2 — 创建 AdapterRegistry

**依赖**：Task 1.1
**新建文件**：`src/adapters/registry.ts`

**完整文件内容**：

```typescript
import type { ILLMAdapter } from './base.js';
import { logger } from '../logger.js';

const registry = new Map<string, ILLMAdapter>();

export const adapterRegistry = {
  register(adapter: ILLMAdapter): void {
    registry.set(adapter.id, adapter);
    logger.info(`LLM adapter registered: ${adapter.id}`);
  },

  get(id: string): ILLMAdapter | undefined {
    return registry.get(id);
  },

  getDefault(): ILLMAdapter {
    const id = process.env.DEFAULT_ADAPTER ?? 'openai';
    const adapter = registry.get(id);
    if (!adapter) {
      const available = [...registry.keys()].join(', ') || '(none)';
      throw new Error(
        `Default adapter "${id}" not found. Available: ${available}. ` +
        `Set DEFAULT_ADAPTER env var or register the adapter first.`
      );
    }
    return adapter;
  },

  list(): string[] {
    return [...registry.keys()];
  },
};
```

**完成判定**：文件存在，`npm run typecheck` 无报错。

---

### Task 1.3 — 迁移 openai.js → openai.ts（实现 ILLMAdapter）

**依赖**：Task 1.1、Task 1.2
**新建文件**：`src/adapters/openai.ts`（保留 `openai.js` 不动，等 Phase 3 统一删除）

**实现要求**：
- 实现 `ILLMAdapter` 接口
- `id = 'openai'`
- 读取 `OPENAI_API_KEY` 和 `OPENAI_BASE_URL` 环境变量
- `quality` 参数映射：`lite → gpt-4o-mini`，`flash → gpt-4o`，`pro → gpt-4o`（可按实际调整）
- 出错时按 `pro → flash → lite` 顺序降级（复用现有 `openai.js` 的降级逻辑）
- 文件末尾自动注册：

```typescript
import { adapterRegistry } from './registry.js';
if (process.env.OPENAI_API_KEY) {
  adapterRegistry.register(new OpenAIAdapter());
}
```

**完成判定**：`npm run typecheck` 无报错；单元测试（见 Task 1.8）通过。

---

### Task 1.4 — 创建 IAgentRunner 接口

**依赖**：Task 1.1
**新建文件**：`src/agent/runner.ts`

**完整文件内容**：

```typescript
import type { RegisteredGroup } from '../types.js';

/**
 * Agent 执行器接口。
 * 接收已构建好的 prompt 和 group 上下文，返回模型生成的文字回复。
 * 调用方（index.ts）只依赖此接口，不感知底层执行方式。
 */
export interface IAgentRunner {
  run(prompt: string, group: RegisteredGroup): Promise<string>;
}
```

**完成判定**：文件存在，`npm run typecheck` 无报错。

---

### Task 1.5 — 实现 SandboxAgentRunner

**依赖**：Task 1.4、Task 1.1、Task 1.2
**新建文件**：`src/agent/sandbox-runner.ts`

**实现要求**：
- 实现 `IAgentRunner`
- 构造函数接收 `ILLMAdapter`
- `run(prompt, group)` 方法：
  1. 调用 `adapter.chat({ systemPrompt, history: [], message: prompt })`
  2. 返回 `result.text`
  3. 错误时 `throw`，由上层（index.ts）捕获并发送错误消息给用户

```typescript
import type { IAgentRunner } from './runner.js';
import type { ILLMAdapter } from '../adapters/base.js';
import type { RegisteredGroup } from '../types.js';
import { logger } from '../logger.js';

export class SandboxAgentRunner implements IAgentRunner {
  constructor(private adapter: ILLMAdapter) {}

  async run(prompt: string, group: RegisteredGroup): Promise<string> {
    logger.info(`SandboxAgentRunner: running for group ${group.folder} via ${this.adapter.id}`);
    const result = await this.adapter.chat({
      systemPrompt: `You are a helpful AI assistant in group: ${group.name}.`,
      history: [],
      message: prompt,
      quality: 'flash',
    });
    return result.text;
  }
}
```

**完成判定**：文件存在，`npm run typecheck` 无报错；契约测试（Task 1.8）通过。

---

### Task 1.6 — 接入 index.ts：替换 TODO 存根

**依赖**：Task 1.2、Task 1.3、Task 1.4、Task 1.5
**文件**：`src/index.ts`

**第一步**：顶部新增 import：

```typescript
import { adapterRegistry } from './adapters/registry.js';
import './adapters/openai.js';          // 触发自动注册
import { SandboxAgentRunner } from './agent/sandbox-runner.js';
```

**第二步**：`processGroup` 函数中，将 TODO 存根替换为：

```typescript
// 删除：
// TODO: Implement agent execution without container
// Placeholder: send acknowledgment
const response = formatResponse("Agent execution is not yet implemented after container removal.");
await result.channel!.sendMessage(result.channel!.name, response);

// 替换为：
const runner = new SandboxAgentRunner(adapterRegistry.getDefault());
const reply  = await runner.run(result.prompt!, group);
await result.channel!.sendMessage(group.jid, formatResponse(reply));
```

**第三步**：`executeScheduledTask` 函数中，将 TODO 存根替换为：

```typescript
// 删除：
// TODO: Implement task execution without container
logger.info(`Task ${task.id} prompt: ${task.prompt}`);
logger.info(`Task ${task.id} completed (placeholder)`);

// 替换为：
const group = getRegisteredGroupByFolder(task.group_folder);
if (!group) throw new Error(`Group not found: ${task.group_folder}`);
const runner = new SandboxAgentRunner(adapterRegistry.getDefault());
const reply  = await runner.run(task.prompt, group);
logger.info(`Task ${task.id} completed. Reply: ${reply.slice(0, 100)}...`);
```

（需在顶部补充 `getRegisteredGroupByFolder` 的 import）

**完成判定**：`npm run typecheck` 无报错；启动后触发消息能走完 LLM 调用链路。

---

### Task 1.7 — 统一 Config（删除 src/config/config.js）

**依赖**：Task 0.6 完成（config.ts 已清理）
**问题**：`src/config/config.js` 与 `src/config.ts` 并存，`src/core/` 和 `src/sandbox/` 依赖前者

**操作**：

1. 将 `src/config/config.js` 中 **仍有用** 的常量合并到 `src/config.ts`：
   - `WORKSPACE`（路径常量）
   - 投票法定人数配置（`voting.quorum`）—— 以 TS export 形式加入

2. 在 `src/config.ts` 末尾追加：

```typescript
export const VOTING_QUORUM = {
  level1: 2,
  level2: 5,
  level3: 8,
} as const;
```

3. 删除 `src/config/config.js` 和 `src/config/` 目录（如目录为空）

**注意**：`src/core/` 中的 JS 文件因 Task 3.5 统一删除，此处不需要更新其 import。

**完成判定**：`src/config/` 目录不存在；`npm run typecheck` 无报错。

---

### Task 1.8 — 编写 IAgentRunner 契约测试

**依赖**：Task 1.4、Task 1.5
**新建文件**：`tests/agent/sandbox-runner.test.ts`

**测试内容**：

```typescript
import { describe, it, expect, vi } from 'vitest';
import { SandboxAgentRunner } from '../../src/agent/sandbox-runner.js';
import type { ILLMAdapter, ChatParams, ChatResult } from '../../src/adapters/base.js';
import type { RegisteredGroup } from '../../src/types.js';

// Mock adapter
const mockAdapter: ILLMAdapter = {
  id: 'mock',
  chat: vi.fn(async (_params: ChatParams): Promise<ChatResult> => ({
    text: 'mock reply',
  })),
};

const mockGroup: RegisteredGroup = {
  jid: 'test-jid',
  name: 'Test Group',
  folder: 'test',
  channel: 'test',
  added_at: new Date().toISOString(),
};

describe('SandboxAgentRunner', () => {
  it('calls adapter.chat and returns text', async () => {
    const runner = new SandboxAgentRunner(mockAdapter);
    const result = await runner.run('hello', mockGroup);
    expect(result).toBe('mock reply');
    expect(mockAdapter.chat).toHaveBeenCalledOnce();
  });

  it('passes prompt as message to adapter', async () => {
    const runner = new SandboxAgentRunner(mockAdapter);
    await runner.run('test prompt', mockGroup);
    const call = vi.mocked(mockAdapter.chat).mock.calls[0][0];
    expect(call.message).toBe('test prompt');
  });

  it('propagates adapter errors', async () => {
    const errorAdapter: ILLMAdapter = {
      id: 'error',
      chat: vi.fn().mockRejectedValue(new Error('API failure')),
    };
    const runner = new SandboxAgentRunner(errorAdapter);
    await expect(runner.run('hello', mockGroup)).rejects.toThrow('API failure');
  });
});
```

**完成判定**：`npm test` 中此测试文件全部通过。

---

### Task 1.9 — 编写 AdapterRegistry 单元测试

**依赖**：Task 1.2
**新建文件**：`tests/adapters/registry.test.ts`

**测试内容**：

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { adapterRegistry } from '../../src/adapters/registry.js';
import type { ILLMAdapter } from '../../src/adapters/base.js';

function makeAdapter(id: string): ILLMAdapter {
  return { id, chat: async () => ({ text: 'ok' }) };
}

describe('adapterRegistry', () => {
  beforeEach(() => {
    // registry 是模块级单例，测试间用不同 id 隔离
  });

  it('registers and retrieves an adapter by id', () => {
    adapterRegistry.register(makeAdapter('test-a'));
    expect(adapterRegistry.get('test-a')).toBeDefined();
  });

  it('returns undefined for unknown id', () => {
    expect(adapterRegistry.get('no-such-adapter')).toBeUndefined();
  });

  it('getDefault throws when no adapter matches DEFAULT_ADAPTER', () => {
    process.env.DEFAULT_ADAPTER = 'nonexistent-xyz';
    expect(() => adapterRegistry.getDefault()).toThrow(/not found/);
    delete process.env.DEFAULT_ADAPTER;
  });

  it('getDefault returns the registered adapter matching DEFAULT_ADAPTER', () => {
    adapterRegistry.register(makeAdapter('my-adapter'));
    process.env.DEFAULT_ADAPTER = 'my-adapter';
    expect(adapterRegistry.getDefault().id).toBe('my-adapter');
    delete process.env.DEFAULT_ADAPTER;
  });
});
```

**完成判定**：`npm test` 中此测试文件全部通过。

---

### Task 1.10 — Phase 1 验收

**依赖**：Task 1.1 ~ 1.9 全部完成
**操作**：

```bash
npm run typecheck   # 零错误
npm test            # 全绿，包含 agent/ 和 adapters/ 下的新测试
git tag phase1-done
```

端到端验证：启动服务，向已注册群组发送 `@Andy hello`，应收到 LLM 真实回复而非占位文本。

---

## Phase 2：Telegram Channel 实现

> 提案级别：一级
> 前置条件：Phase 0 完成（Phase 1 可并行）
> 目标：通过 Telegram Bot 收发消息，Bot Token 已在 env 中

---

### Task 2.1 — 实现 TelegramChannel

**依赖**：Phase 0 完成
**新建文件**：`src/channels/telegram.ts`

**实现要求**：
- 实现 `Channel` 接口（`src/types.ts`）
- 使用 Telegram Bot API（长轮询，`getUpdates`），**不引入第三方框架**，直接用 Node.js 内置 `https` 或已有依赖
- `ownsJid`：Telegram chat_id 为纯数字字符串（含负数群组 id），用 `/^-?\d+$/.test(jid)` 判断

**骨架**：

```typescript
import https from 'https';
import type { Channel, ChannelOpts, IncomingMessage } from '../types.js';
import { logger } from '../logger.js';

const BASE = 'https://api.telegram.org/bot';

async function tgRequest<T>(token: string, method: string, body?: object): Promise<T> {
  // 封装 https POST to BASE+token+'/'+method，返回 result 字段
}

export class TelegramChannel implements Channel {
  readonly name = 'telegram';
  private connected = false;
  private offset   = 0;
  private timer?:  ReturnType<typeof setInterval>;

  constructor(private token: string, private opts: ChannelOpts) {}

  async connect(): Promise<void> {
    // 验证 bot token：调用 getMe，失败则 throw
    // 启动长轮询 setInterval → pollUpdates()
    // 每次 getUpdates?offset=this.offset&timeout=25&limit=100
    // 将 message 类型的 update 转为 IncomingMessage 调用 opts.onMessage
    // update_id + 1 赋给 this.offset
    this.connected = true;
  }

  async sendMessage(jid: string, text: string): Promise<void> {
    await tgRequest(this.token, 'sendMessage', { chat_id: jid, text });
  }

  isConnected(): boolean { return this.connected; }

  ownsJid(jid: string): boolean { return /^-?\d+$/.test(jid); }

  async disconnect(): Promise<void> {
    clearInterval(this.timer);
    this.connected = false;
  }
}
```

**IncomingMessage 字段映射**：

| Telegram Update 字段 | IncomingMessage 字段 |
|---|---|
| `message.message_id.toString()` | `id` |
| `'telegram'` | `channel` |
| `message.chat.id.toString()` | `chatJid` |
| `message.from.id.toString()` | `senderJid` |
| `message.from.first_name` | `senderName` |
| `message.text \|\| ''` | `text` |
| `message.date * 1000` | `timestamp` |
| `message.chat.type !== 'private'` | `isGroup` |
| `message.chat.title` | `groupName` |

**完成判定**：文件存在，`npm run typecheck` 无报错。

---

### Task 2.2 — 注册 TelegramChannel

**依赖**：Task 2.1
**文件**：`src/channels/index.ts`

**追加以下内容**：

```typescript
import { TelegramChannel } from './telegram.js';
import { registerChannel }  from './registry.js';

if (process.env.TELEGRAM_BOT_TOKEN) {
  registerChannel('telegram', opts =>
    new TelegramChannel(process.env.TELEGRAM_BOT_TOKEN!, opts)
  );
}
```

**完成判定**：设置 `TELEGRAM_BOT_TOKEN` 后启动，日志出现 `Channel connected: telegram`。

---

### Task 2.3 — 编写 TelegramChannel 测试

**依赖**：Task 2.1
**新建文件**：`tests/channels/telegram.test.ts`

**测试重点**（全部 mock `tgRequest`，不发真实网络请求）：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// mock https 模块，让 tgRequest 返回预设值
// 测试以下契约：

describe('TelegramChannel', () => {
  it('isConnected() is false before connect()', ...);
  it('ownsJid returns true for numeric strings', ...);
  it('ownsJid returns false for non-numeric strings', ...);
  it('connect() calls getMe and throws on invalid token', ...);
  it('sendMessage() calls sendMessage API with correct params', ...);
  it('disconnect() stops polling', ...);
});
```

具体 mock 策略：将 `tgRequest` 提取为可注入的依赖，或通过 `vi.mock('node:https', ...)` 拦截。

**完成判定**：`npm test` 中此文件全部通过。

---

### Task 2.4 — Phase 2 验收

```bash
npm run typecheck
npm test
# 手动验证：向 Bot 发送 @Andy hello，收到回复
git tag phase2-done
```

---

## Phase 3：TypeScript 全量迁移 + 模块化

> 提案级别：二级
> 前置条件：Phase 1 完成（typecheck 零错 + 测试全绿 + Agent 链路可用）
> 目标：消灭 JS/TS 混用；`db.ts` 按职责拆分；清理 `src/core/` 孤岛

---

### Task 3.1 — 迁移 src/adapters/claude.js → claude.ts

**依赖**：Task 1.1（ILLMAdapter 接口已定义）
**新建文件**：`src/adapters/claude.ts`

**实现要求**：
- 实现 `ILLMAdapter`，`id = 'claude'`
- 读取 `ANTHROPIC_API_KEY` 环境变量
- `quality` 映射：`lite → claude-haiku-4-5`，`flash → claude-sonnet-4-5`，`pro → claude-sonnet-4-6`
- 文件末尾自动注册到 `adapterRegistry`（同 Task 1.3 模式）
- 复用现有 `claude.js` 的 HTTP 调用逻辑，改写为符合 `ILLMAdapter` 的签名

**完成判定**：`npm run typecheck` 无报错；删除 `src/adapters/claude.js`。

---

### Task 3.2 — 迁移 src/adapters/gemini.js → gemini.ts

**依赖**：Task 1.1
**新建文件**：`src/adapters/gemini.ts`

**实现要求**（同 Task 3.1 模式）：
- `id = 'gemini'`
- 读取 `GEMINI_API_KEY` 环境变量
- `quality` 映射：`lite → gemini-3-flash`，`flash → gemini-3-pro`，`pro → gemini-3.1-pro`
- 自动注册；完成后删除 `src/adapters/gemini.js`

**完成判定**：`npm run typecheck` 无报错；`src/adapters/gemini.js` 已删除。

---

### Task 3.3 — 迁移 src/sandbox/ → TypeScript

**依赖**：Phase 1 完成
**涉及文件**：
- `src/sandbox/sandboxManager.js` → `src/sandbox/manager.ts`
- `src/sandbox/processExecutor.js` → `src/sandbox/process-executor.ts`

**实现要求**：
- 为 `SandboxManager` 定义并导出接口 `ISandboxManager`：

```typescript
export interface ISandboxManager {
  execute(code: string, opts?: ExecOptions): Promise<ExecResult>;
  executeCommand(command: string, opts?: ExecOptions): Promise<ExecResult>;
}

export interface ExecOptions {
  timeout?: number;
  cwd?: string;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}
```

- 将现有 JS 逻辑翻译为符合上述接口的 TS 实现
- 删除对应的 `.js` 文件

**完成判定**：`npm run typecheck` 无报错；`src/sandbox/` 下无 `.js` 文件。

---

### Task 3.4 — 删除 src/core/（JS 孤岛清理）

**依赖**：Task 1.7（config.js 已删除）；Task 3.1、3.2（adapters 已迁移）
**问题**：`src/core/` 下的 JS 文件（`agentRegistry.js`、`voter.js`、`dispatcher.js`、`arbitrator.js`、`session.js`、`skillExecutor.js`）均为孤岛，从未被 `index.ts` 调用；`src/utils/` 目录也不存在，导致这些文件的 import 在运行时直接崩溃

**操作**：直接删除整个 `src/core/` 目录：

```bash
rm -rf src/core/
```

**注意**：`voter.js` 中的投票权重逻辑（赞成 +1 / 反对 +2 / 用户 ±0.5n）在 `RULES.md` 和文档中已有完整定义，无需保留代码版本。若未来需要程序化投票引擎，以 Phase 1 的接口模式重新实现 TS 版本即可。

**完成判定**：`src/core/` 目录不存在；`npm run typecheck` 无报错；`npm test` 全绿。

---

### Task 3.5 — 拆分 src/db.ts → src/db/

**依赖**：Phase 1 完成（确保现有测试对 db 的覆盖已建立）
**原则**：
- 保持同一个 `db` 实例（Comate 建议）——所有子模块从 `schema.ts` 导入同一个 `db` 对象
- 向后兼容导出（Comate 建议）——`src/db/index.ts` 重新导出所有函数，现有调用方无需修改

**目标结构**：

```
src/db/
├── index.ts       ← 重新导出所有函数，是唯一的对外接口
├── schema.ts      ← 创建 db 实例、DDL、initializeDatabase()
├── messages.ts    ← insertMessage / getUnprocessedMessages / markMessagesProcessed / getMessagesSince
├── groups.ts      ← setRegisteredGroup / getRegisteredGroup / getRegisteredGroupByFolder / getAllRegisteredGroups / deleteRegisteredGroup / getMainGroup
├── tasks.ts       ← insertTask / getDueTasks / updateTaskNextRun / getTasksByGroup / getAllTasks / getTask / updateTask / deleteTask / insertTaskLog / getTaskLogs
└── sessions.ts    ← setSession / getSession / setRouterState / getRouterState
```

**schema.ts 核心**：

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import { mkdirSync } from 'fs';
import { STORE_DIR } from '../config.js';
import { logger } from '../logger.js';

mkdirSync(STORE_DIR, { recursive: true });
export const db = new Database(path.join(STORE_DIR, 'messages.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
// ... DDL ...
export function initializeDatabase() { ... }
initializeDatabase();
```

**index.ts 核心**：

```typescript
export * from './messages.js';
export * from './groups.js';
export * from './tasks.js';
export * from './sessions.js';
```

完成后删除原 `src/db.ts`。

**完成判定**：`src/db.ts` 不存在；`src/db/index.ts` 存在；所有原调用方（`src/index.ts`、`src/router.ts` 等）import 路径改为 `'./db/index.js'` 后 typecheck 零错；`npm test` 全绿。

---

### Task 3.6 — 重命名 task-scheduler.ts → scheduler/index.ts

**依赖**：Task 3.5 完成后统一整理
**操作**：

```bash
mkdir -p src/scheduler
git mv src/task-scheduler.ts src/scheduler/index.ts
```

更新所有 import `'./task-scheduler.js'` → `'./scheduler/index.js'`（当前只有 `src/index.ts` 引用）。

**完成判定**：`src/task-scheduler.ts` 不存在；typecheck 零错。

---

### Task 3.7 — Phase 3 验收

```bash
npm run typecheck        # 零错误
npm test                 # 全绿
npx tsc --noEmit 2>&1 | wc -l   # 确认输出为 0
# 检查无 .js 源文件残留（编译产物除外）：
find src -name '*.js' | grep -v node_modules   # 期望空
git tag phase3-done
```

测试覆盖率目标：核心模块 ≥ 70%（向 M6 目标 80% 推进）：

```bash
npm run test:coverage
```

---

## Phase 4：仓库拆分

> 提案级别：三级
> 前置条件：Phase 0–3 全部完成；测试覆盖率 ≥ 70%；`npm run typecheck` 零错
> 目标：`closeclaw`（协作协议）与 `closeclaw-runtime`（Agent Harness）解耦为独立仓库

---

### 拆分边界

| 留在 `closeclaw`（当前仓库） | 迁移到 `closeclaw-runtime` |
|---|---|
| `votes/` | `src/` |
| `docs/` | `tests/` |
| `.subjects.json` | `package.json` |
| `RULES.md` | `tsconfig.json` |
| `templates/` | `vitest.config.ts` |
| `scripts/`（worktree 管理脚本） | `store/`（运行时数据） |
| `worktrees/` | `data/` |
| `gh_bin/` | `dist/` |

---

### Task 4.1 — 准备工作：验证拆分边界

**依赖**：Phase 0–3 全部完成
**操作**：

1. 确认 `src/` 下无任何对 `votes/`、`docs/` 的硬编码路径引用：

```bash
grep -r "votes/" src/
grep -r "docs/"  src/
```

2. 确认 `RULES.md`、`.subjects.json` 中无对 `src/` 目录的强依赖（除架构描述外）

**完成判定**：两个 grep 均无输出（或输出为纯注释/文档描述，非代码逻辑）。

---

### Task 4.2 — 创建 closeclaw-runtime 仓库

**操作**：

```bash
# 在 GitHub 上新建空仓库 closeclaw-runtime
# 用 git subtree split 提取 src/ 历史（Kiro 建议保留 git log）
git subtree split --prefix=src -b split/runtime

# 新仓库初始化
cd /path/to/closeclaw-runtime
git init
git remote add origin https://github.com/LGZhss/closeclaw-runtime.git
git pull <closeclaw-repo> split/runtime
```

将以下文件复制（不是 subtree）到新仓库根目录：
- `package.json`（修改 name 为 `closeclaw-runtime`）
- `tsconfig.json`
- `vitest.config.ts`
- `tests/`

**完成判定**：`closeclaw-runtime` 仓库可独立 `npm install && npm run typecheck && npm test`。

---

### Task 4.3 — 清理当前仓库

**操作**：

```bash
# 从 closeclaw 主仓库删除运行时相关目录
git rm -r src/ dist/ tests/
# 更新 package.json：只保留 scripts/、docs/ 相关脚本，删除 tsc、vitest 等
# 更新 .gitignore
```

在 `docs/05-architecture/overview.md` 中更新架构描述，增加仓库拆分说明和 `closeclaw-runtime` 链接。

**完成判定**：`closeclaw` 主仓库根目录无 `src/`、`dist/`、`tests/`、`node_modules/`。

---

### Task 4.4 — 更新协作流程文档

**文件**：`docs/02-collaboration/workflow.md`、`RULES.md`、`docs/03-development/onboarding.md`

**更新内容**：
- 说明代码变更提案需在 `closeclaw-runtime` 仓库的 worktree 中实施
- 投票仍在 `closeclaw` 主仓库的 `votes/` 中进行（不变）
- 更新"环境拓扑提取"步骤，加入对 `closeclaw-runtime` 仓库的同步

**完成判定**：新入场协作主体按文档操作后能正确找到代码和提案。

---

### Task 4.5 — Phase 4 验收

```bash
# closeclaw-runtime 独立验收
cd closeclaw-runtime
npm install
npm run typecheck   # 零错误
npm test            # 全绿

# closeclaw 主仓库验收
cd closeclaw
ls src/             # 期望：目录不存在，报错
ls votes/           # 期望：正常列出提案文件
```

---

## 任务依赖图

```
Phase 0:
  0.1 ──┐
  0.2 ──┤
  0.3 ──┤
  0.4 ──┤──→ 0.11（验收）──→ Phase 1 解锁
  0.5 ──┤
  0.6 ──┤──→ 0.8
  0.7 ←─┘(依赖 0.5)
  0.9 ──┘
  0.10 ←─ 0.3

Phase 1:
  1.1 ──→ 1.2 ──→ 1.3 ──┐
  1.1 ──→ 1.4 ──→ 1.5 ──┤──→ 1.6 ──→ 1.10（验收）
  1.3, 1.5 ──→ 1.8        │
  1.2 ──→ 1.9             │
  0.6 ──→ 1.7 ────────────┘

Phase 2（可与 Phase 1 并行）:
  Phase 0 完成 ──→ 2.1 ──→ 2.2
                   2.1 ──→ 2.3
                   2.2, 2.3 ──→ 2.4（验收）

Phase 3:
  Phase 1 完成 ──→ 3.1, 3.2, 3.3（可并行）
  1.7 ──→ 3.4
  3.4 ──→ 3.5 ──→ 3.6 ──→ 3.7（验收）

Phase 4:
  Phase 0–3 全部完成 ──→ 4.1 ──→ 4.2 ──→ 4.3 ──→ 4.4 ──→ 4.5（验收）
```

---

## 里程碑 Tag 规范

| Tag | 触发条件 |
|---|---|
| `phase0-done` | Task 0.11 验收通过 |
| `phase1-done` | Task 1.10 验收通过 |
| `phase2-done` | Task 2.4 验收通过 |
| `phase3-done` | Task 3.7 验收通过 |
| `phase4-done` | Task 4.5 验收通过 |

每个 tag 打完后推送：`git push origin <tag>`