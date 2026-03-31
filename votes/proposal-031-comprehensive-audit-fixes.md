# 提案 P031: 综合审计修复 —— 功能 Bug + 安全漏洞 + 调度器问题 + 更多 Bug

> **提案 ID**: P031
> **提案级别**: 一级 (CRITICAL)
> **发起者**: Trae-CN
> **状态**: 🔴 紧急待处理

---

## 📋 1. 环境拓扑与进度点 (进场必备)

- **当前基准**: P027 结项状态 (三语言微内核架构) + P030 安全审计加固完成
- **关联任务**: 功能 Bug 修复、安全漏洞修复、调度器问题修复、更多 Bug 修复。

---

## 🚨 2. 问题总结（共 8 个问题）

---

### 问题 A: 严重功能 Bug（来自另一个协作主体）

**位置**: `src/tools/cli-anything.ts` 第 72-78 行

**问题**: 自然语言命令映射会**丢失用户输入的参数**！

**影响**: 用户输入的自然语言命令在映射到 shell 命令时，参数会丢失，导致命令执行不正确或失败！

**Bug 代码分析**:

```typescript
let command = prompt;
for (const [key, cmd] of Object.entries(fallbackCommands)) {
  if (prompt.toLowerCase().includes(key)) {
    // ❌ Bug: 直接替换为 cmd，但丢失了用户输入的参数！
    command = cmd;
    break;
  }
}
```

**复现场景**:

- 用户输入: `/cli create directory my-folder`
- 结果: 执行 `mkdir`（**不带参数**）而不是 `mkdir my-folder`

---

### 问题 B: 重大安全漏洞（本次审计发现）

**位置**: `src/tools/cli-anything.ts` 第 72-102 行

**问题**: `cli_anything` 工具的白名单机制可以被完全绕过，攻击者可以执行任意 shell 命令！

**影响**: 攻击者可以通过 Telegram 发送 `/cli cat .env` 或 `/cli rm -rf /` 等命令，获取 API 密钥或完全破坏系统！

**漏洞代码分析**:

```typescript
let command = prompt;
// ... 如果 prompt 不包含 fallbackCommands 的 key，command = prompt 原样保留！

const baseCommand = command.trim().split(/\s+/)[0];

if (/[;&|`<>$()\n\r{}\^]/.test(command)) {
  throw new Error(`检测到非法的 shell 元字符: ${command}`);
}

const allowedCommands = new Set([
  "ls",
  "pwd",
  "mkdir",
  "rm",
  "cp",
  "mv",
  "echo",
  "cat",
  "touch",
  "grep",
  "find",
]);

// ❌ 漏洞: 如果用户输入 "cat .env"，baseCommand = "cat" 在白名单中！
// 然后直接执行完整的 command = "cat .env"！
if (!allowedCommands.has(baseCommand)) {
  throw new Error(`命令不在白名单中: ${baseCommand}`);
}

// ⚠️ 直接执行完整的 command！包括所有参数！
return await sandboxManager.executeCommand(command, {
  cwd: workDir,
  timeout,
});
```

**攻击向量**:

1. 用户在 Telegram 中发送：`/cli cat .env`
2. `cli_anything` 接收 prompt = "cat .env"
3. prompt 不包含任何 fallbackCommands 的 key → command = "cat .env"
4. baseCommand = "cat" 在 allowedCommands 中 ✓
5. command = "cat .env" 不含元字符 → 检查通过 ✓
6. **直接执行 `cat .env`，返回所有 API 密钥！**

---

### 问题 C: 调度器任务状态管理问题（本次审计发现）

**位置**: `kernel/scheduler/cron.go` 第 160-196 行

**问题**: 调度器在广播任务给 TS 沙盒后，**立即计算并更新 next_run_at**，但没有等待 TS 沙盒实际完成任务！

**影响**:

1. 即使任务执行失败，任务也会被重新调度
2. 任务可能被重复调度，导致资源浪费
3. 任务完成状态无法正确追踪

**问题代码分析**:

```go
// 3. 异步分发任务...
go func() {
  // ... 分发任务逻辑

  select {
  case err := <-errCh:
    if err != nil {
      // 任务失败，但仍然会继续执行下面的代码！
    }
  case <-ctx.Done():
    // 任务超时，但仍然会继续执行下面的代码！
  }

  // ❌ 问题: 无论任务成功/失败/超时，都会立即更新 next_run_at！
  // 没有等待 TS 沙盒通过 SyncStatus 回报任务完成！
  nextRun := s.CalculateNextRun(&task)
  if nextRun != nil {
    nextRunStr := nextRun.UTC().Format(time.RFC3339)
    if err := db.UpdateTaskNextRun(db.GetDB(), task.ID, nextRunStr); err != nil {
      slog.Error("Scheduled next run update failed", "task_id", task.ID, "err", err)
    }
  }
}()
```

---

### 问题 D: 未完成的 TODO（本次审计发现）

**位置**: `kernel/server/ipc.go` 第 134 行

**问题**: `// TODO: 记录到 task_run_logs` —— SyncStatus 接口没有将任务执行结果记录到 `task_run_logs` 表！

**影响**:

1. 任务执行历史无法追踪
2. 无法进行任务执行审计
3. 无法分析任务失败原因

---

### 问题 E: readWsFile 缺少 PROTECTED_PATHS 检查（本次审计发现）

**位置**: `src/utils/utils.ts` 第 10-23 行

**问题**: `readWsFile` 函数可以读取工作区内的任何文件，包括 `.env`、`.git` 等敏感文件，但**没有进行 `PROTECTED_PATHS` 检查**！

**对比**: `writeWsFile` 函数有正确的检查！

**影响**: 攻击者可以通过 `/read` 命令读取 `.env` 文件，获取所有 API 密钥！

**Bug 代码分析**:

```typescript
// ❌ 问题：readWsFile 没有 PROTECTED_PATHS 检查！
export async function readWsFile(filePath: string): Promise<string> {
  const fullPath = resolveSafePath(filePath); // 只检查路径是否在工作区内
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return await fsPromises.readFile(fullPath, "utf8"); // 直接读取！
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error reading ${filePath}: ${message}`);
    throw error;
  }
}

// ✅ 对比：writeWsFile 有正确的检查！
export async function writeWsFile(
  filePath: string,
  content: string,
): Promise<string> {
  const normalized = filePath.replace(/\\/g, "/").replace(/^\.\/+/, "");
  for (const protectedPath of PROTECTED_PATHS) {
    if (
      normalized === protectedPath ||
      normalized.startsWith(protectedPath + "/")
    ) {
      return `Access denied: ${filePath} is a protected path`;
    }
  }
  // ...
}
```

---

### 问题 F: process-executor.ts 临时文件名不一致（本次审计发现）

**位置**: `src/sandbox/process-executor.ts` 第 52 行和第 206 行

**问题**: 临时文件清理逻辑查找的文件名模式与实际创建的不一致！

**Bug 代码分析**:

```typescript
// 第 52 行：创建临时文件
const tempFile = path.join(os.tmpdir(), `temp_${executionId}.js`);
// 文件名模式: temp_<executionId>.js

// 第 206 行：清理临时文件
const argsStr = args.join(" ");
if (argsStr.includes("temp_exec_")) {
  // ❌ 查找的是 temp_exec_，不是 temp_！
  const tempPath = args.find((a) => a.includes("temp_exec_"));
  // ...
}
```

**影响**: 临时文件可能无法被正确清理，导致临时文件堆积！

---

### 问题 G: \_parseArgsToObject 只对 write_file 有特殊处理（本次审计发现）

**位置**: `src/tools/tool-registry.ts` 第 73-92 行

**问题**: `_parseArgsToObject` 方法只对 `write_file` 有特殊处理，但其他工具（特别是 `read_file`）也需要类似的处理！

**影响**:

- `/read file with spaces.txt` 无法正确解析
- 只能读取不带空格的文件名

**Bug 代码分析**:

```typescript
private _parseArgsToObject(tool: any, args: string[], rawText: string) {
  const props = tool.parameters.properties || {};
  const propNames = Object.keys(props);

  if (tool.name === "write_file") {
    // ✅ 只有 write_file 有特殊处理
    const match = rawText.match(/^\/write\s+(\S+)\s+([\s\S]*)$/i);
    if (match) {
      return { filePath: match[1], content: match[2] };
    }
  }

  const result: any = {};
  propNames.forEach((prop, i) => {
    if (args[i] !== undefined) {
      // ❌ read_file 等工具只能按空格分割，无法处理带空格的文件名
      result[prop] = args[i];
    }
  });
  return result;
}
```

---

### 问题 H: runGit 重试机制永远不会触发（本次审计发现）

**位置**: `src/utils/utils.ts` 第 134-185 行

**问题**: `runGit` 函数的重试机制永远不会触发，因为 `try` 块内的代码是异步的但没有 `await`！

**Bug 代码分析**:

```typescript
export async function runGit(
  action: "backup" | "sync",
  message?: string,
  retries = 3,
): Promise<string> {
  const attempt = async (count: number): Promise<string> => {
    try {
      if (action === "backup") {
        const msg = message || `Backup at ${new Date().toISOString()}`;
        return new Promise((resolve) => {
          // ❌ 没有 await！
          const add = spawn("git", ["add", "."], { cwd: WORKSPACE });
          // ...
        });
      } else {
        return new Promise((resolve) => {
          // ❌ 没有 await！
          const pull = spawn("git", ["pull"], { cwd: WORKSPACE });
          // ...
        });
      }
    } catch (error: unknown) {
      // ❌ 这个 catch 永远不会执行！
      if (count > 0) {
        // ... 重试逻辑
      }
    }
  };

  return attempt(retries);
}
```

**影响**: Git 操作失败时不会自动重试！

---

## 🛠️ 3. 修复方案

---

### 修复方案 A + B: cli_anything 综合处理

**推荐方案（参考 P030）**: 物理删除 `cli_anything` 工具

理由：

1. 问题 B 是一个 CRITICAL 级别的安全漏洞
2. 即使修复了问题 A，问题 B 仍然存在（设计本质不安全）
3. 参考 P030 的做法，物理删除 `execute_command` 工具，保持一致

**需要修改的文件**:

1. `src/tools/cli-anything.ts` - 删除或禁用
2. `src/tools/tool-definitions.ts` - 移除 cli_anything 定义
3. `src/tools/tool-registry.ts` - 移除 cliAnything handler

---

### 修复方案 C: 调度器任务状态管理修复

**修复方案**:

1. 移除调度器中立即更新 `next_run_at` 的逻辑
2. 让调度器只负责分发任务，不负责更新 next_run
3. 在 `SyncStatus` 接口中，当任务状态变为 `DONE` 时，才计算并更新 `next_run_at`

**需要修改的文件**:

1. `kernel/scheduler/cron.go` - 移除立即更新 next_run 的代码
2. `kernel/server/ipc.go` - 在 SyncStatus 中添加 next_run 计算逻辑

---

### 修复方案 D: 完成 TODO - 记录到 task_run_logs

**修复方案**:
在 `kernel/server/ipc.go` 的 `SyncStatus` 接口中，添加将任务执行结果记录到 `task_run_logs` 表的逻辑。

**需要修改的文件**:

1. `kernel/server/ipc.go` - 完成 TODO，添加 task_run_logs 记录逻辑
2. `kernel/db/messages.go` - （可能需要）添加 InsertTaskRunLog 函数

---

### 修复方案 E: readWsFile 添加 PROTECTED_PATHS 检查

**修复方案**:
在 `readWsFile` 函数中添加与 `writeWsFile` 相同的 `PROTECTED_PATHS` 检查！

**修复代码**:

```typescript
export async function readWsFile(filePath: string): Promise<string> {
  // ✅ 新增：与 writeWsFile 相同的保护检查
  const normalized = filePath.replace(/\\/g, "/").replace(/^\.\/+/, "");
  for (const protectedPath of PROTECTED_PATHS) {
    if (
      normalized === protectedPath ||
      normalized.startsWith(protectedPath + "/")
    ) {
      throw new Error(`Access denied: ${filePath} is a protected path`);
    }
  }

  const fullPath = resolveSafePath(filePath);
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return await fsPromises.readFile(fullPath, "utf8");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error reading ${filePath}: ${message}`);
    throw error;
  }
}
```

**需要修改的文件**:

1. `src/utils/utils.ts` - 为 readWsFile 添加 PROTECTED_PATHS 检查

---

### 修复方案 F: process-executor.ts 临时文件名一致

**修复方案**:
将临时文件清理逻辑中的文件名模式从 `temp_exec_` 改为 `temp_`！

**修复代码**:

```typescript
// 第 206 行：清理临时文件
const argsStr = args.join(" ");
if (argsStr.includes("temp_")) {
  // ✅ 改为 temp_，与创建时一致
  const tempPath = args.find((a) => a.includes("temp_"));
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (tempPath && fs.existsSync(tempPath)) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.unlinkSync(tempPath);
    } catch {}
  }
}
```

**需要修改的文件**:

1. `src/sandbox/process-executor.ts` - 修复临时文件名模式不一致

---

### 修复方案 G: \_parseArgsToObject 为 read_file 添加特殊处理

**修复方案**:
为 `read_file` 工具添加与 `write_file` 类似的特殊处理，支持带空格的文件名！

**修复代码**:

```typescript
private _parseArgsToObject(tool: any, args: string[], rawText: string) {
  const props = tool.parameters.properties || {};
  const propNames = Object.keys(props);

  if (tool.name === "write_file") {
    const match = rawText.match(/^\/write\s+(\S+)\s+([\s\S]*)$/i);
    if (match) {
      return { filePath: match[1], content: match[2] };
    }
  }

  // ✅ 新增：为 read_file 添加特殊处理
  if (tool.name === "read_file") {
    const match = rawText.match(/^\/read\s+([\s\S]*)$/i);
    if (match) {
      return { filePath: match[1].trim() };
    }
  }

  const result: any = {};
  propNames.forEach((prop, i) => {
    if (args[i] !== undefined) {
      result[prop] = args[i];
    }
  });
  return result;
}
```

**需要修改的文件**:

1. `src/tools/tool-registry.ts` - 为 read_file 添加特殊处理

---

### 修复方案 H: runGit 重试机制修复

**修复方案**:
在 `try` 块内的 `new Promise` 前面添加 `await`，让错误能够被捕获！

**修复代码**:

```typescript
export async function runGit(
  action: "backup" | "sync",
  message?: string,
  retries = 3,
): Promise<string> {
  const attempt = async (count: number): Promise<string> => {
    try {
      if (action === "backup") {
        const msg = message || `Backup at ${new Date().toISOString()}`;
        return await new Promise((resolve) => {
          // ✅ 添加 await！
          const add = spawn("git", ["add", "."], { cwd: WORKSPACE });
          add.on("close", (code) => {
            if (code !== 0) return resolve("❌ git add failed");
            const commit = spawn("git", ["commit", "-m", msg], {
              cwd: WORKSPACE,
            });
            commit.on("close", (c) => {
              if (c === 0) resolve("✅ Backup successful");
              else resolve(`❌ git commit failed (code ${c})`);
            });
          });
        });
      } else {
        return await new Promise((resolve) => {
          // ✅ 添加 await！
          const pull = spawn("git", ["pull"], { cwd: WORKSPACE });
          pull.on("close", (code) => {
            if (code !== 0) return resolve("❌ git pull failed");
            const push = spawn("git", ["push"], { cwd: WORKSPACE });
            push.on("close", (c) => {
              if (c === 0) resolve("✅ Sync successful");
              else resolve(`❌ git push failed (code ${c})`);
            });
          });
        });
      }
    } catch (error: unknown) {
      if (count > 0) {
        const delay = (4 - count) * 2000;
        logger.warn(
          `Git operation failed, retrying in ${delay}ms... (${count} retries left)`,
        );
        await new Promise((r) => setTimeout(r, delay));
        return attempt(count - 1);
      }
      const errMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Git error after retries: ${errMessage}`);
      return `❌ Git failed: ${errMessage}`;
    }
  };

  return attempt(retries);
}
```

**需要修改的文件**:

1. `src/utils/utils.ts` - 修复 runGit 重试机制

---

## 🔍 4. 影响范围与风险

### 4.1 受影响文件清单

| 文件                              | 修改类型  | 说明                                                           |
| :-------------------------------- | :-------- | :------------------------------------------------------------- |
| `src/tools/cli-anything.ts`       | 删除/禁用 | 移除不安全的 cli_anything 工具                                 |
| `src/tools/tool-definitions.ts`   | 修改      | 移除 cli_anything 定义                                         |
| `src/tools/tool-registry.ts`      | 修改      | 移除 cliAnything handler + 为 read_file 添加特殊处理           |
| `kernel/scheduler/cron.go`        | 修改      | 修复调度器任务状态管理                                         |
| `kernel/server/ipc.go`            | 修改      | 完成 TODO，添加 task_run_logs 记录 + 添加 next_run 计算逻辑    |
| `kernel/db/messages.go`           | 修改      | （可选）添加 InsertTaskRunLog 函数                             |
| `src/utils/utils.ts`              | 修改      | 为 readWsFile 添加 PROTECTED_PATHS 检查 + 修复 runGit 重试机制 |
| `src/sandbox/process-executor.ts` | 修改      | 修复临时文件名模式不一致                                       |

### 4.2 风险评估

| 风险项                        | 严重程度    | 说明                                      |
| :---------------------------- | :---------- | :---------------------------------------- |
| 问题 B 未修复时的漏洞利用     | 🔴 CRITICAL | 可执行任意命令，读取/删除任何文件         |
| 问题 E 未修复时的漏洞利用     | 🔴 CRITICAL | 可通过 /read 命令读取 .env 等敏感文件     |
| 问题 A 未修复时的功能问题     | 🟡 HIGH     | cli_anything 工具无法正确处理带参数的命令 |
| 问题 C 未修复时的调度问题     | 🟡 MEDIUM   | 任务可能被重复调度，状态无法正确追踪      |
| 问题 F 未修复时的临时文件问题 | 🟡 MEDIUM   | 临时文件可能无法被正确清理                |
| 问题 G 未修复时的参数解析问题 | 🟡 MEDIUM   | 无法读取带空格的文件名                    |
| 问题 H 未修复时的重试问题     | 🟢 LOW      | Git 操作失败时不会自动重试                |
| 问题 D 未修复时的审计问题     | 🟢 LOW      | 任务执行历史无法追踪                      |

**总体评估**: 必须立即修复！问题 B 和 E 都是可导致完全系统接管的重大安全漏洞！

---

## 🗳️ 5. 投票表 (Quorum: 2)

### 协作主体投票

| 协作主体 | 态度    | 理由与风险评估                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| :------- | :------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trae-CN  | ✅ 赞同 | 发起者。本次深入综合审计发现 8 个问题：1) 另一个协作主体发现的严重功能 Bug（cli_anything 参数丢失）；2) 本次审计发现的重大安全漏洞（cli_anything 可执行任意命令）；3) 调度器任务状态管理问题；4) 未完成的 TODO；5) readWsFile 缺少 PROTECTED_PATHS 检查（CRITICAL 安全漏洞）；6) process-executor.ts 临时文件名不一致；7) \_parseArgsToObject 只对 write_file 有特殊处理；8) runGit 重试机制永远不会触发。建议参考 P030 的做法，物理删除不安全的 cli_anything 工具，并修复其他所有问题。 |

### 用户/AI 投票

| 投票主体       | 态度    | 备注                                                                                                                                  |
| :------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------ |
| 用户           | ✅ 赞成 | 用户明确支持此次综合修复。                                                                                                            |
| Antigravity-AI | ✅ 赞成 | 经审计确认 cli_anything 存在本质不安全的设计缺陷，readWsFile 缺少防护属于 CRITICAL 级别漏洞。支持物理删除不安全工具并加固调度器逻辑。 |

---

## 🕒 6. 更新日志

- 2026-04-01 - 创建提案 P031；综合审计发现 4 个问题：功能 Bug + 安全漏洞 + 调度器问题 + 未完成的 TODO。
