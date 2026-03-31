# 提案 P031: 运行时 Bug 综合修复

> **提案 ID**: P031
> **提案级别**: 二级 (HIGH)
> **发起者**: Trae-CN
> **状态**: 🟡 投票中

---

## 📋 1. 环境拓扑与进度点 (进场必备)
- **当前基准**: P027 结项状态 (三语言微内核架构) + P030 安全审计加固完成
- **关联任务**: 运行时 Bug 修复、调试问题修复。

---

## 🚨 2. 运行时 Bug 总结（共 5 个）

---

### 问题 1: cli_anything 自然语言命令映射丢失参数（来自另一个协作主体）

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

### 问题 2: process-executor.ts 临时文件名不一致（本次审计发现）

**位置**: `src/sandbox/process-executor.ts` 第 52 行和第 206 行

**问题**: 临时文件清理逻辑查找的文件名模式与实际创建的不一致！

**Bug 代码分析**:
```typescript
// 第 52 行：创建临时文件
const tempFile = path.join(os.tmpdir(), `temp_${executionId}.js`);
// 文件名模式: temp_<executionId>.js

// 第 206 行：清理临时文件
const argsStr = args.join(" ");
if (argsStr.includes("temp_exec_")) {  // ❌ 查找的是 temp_exec_，不是 temp_！
  const tempPath = args.find((a) => a.includes("temp_exec_"));
  // ...
}
```

**影响**: 临时文件可能无法被正确清理，导致临时文件堆积！

---

### 问题 3: _parseArgsToObject 只对 write_file 有特殊处理（本次审计发现）

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

### 问题 4: runGit 重试机制永远不会触发（本次审计发现）

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
        return new Promise((resolve) => {  // ❌ 没有 await！
          const add = spawn("git", ["add", "."], { cwd: WORKSPACE });
          // ...
        });
      } else {
        return new Promise((resolve) => {  // ❌ 没有 await！
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

### 问题 5: GroupPool.executeItem defer 注释中的歧义（本次审计发现）

**位置**: `kernel/scheduler/pool.go` 第 108-111 行

**问题**: defer 函数中的注释与实际代码逻辑不一致，可能导致开发者误解！

**Bug 代码分析**:
```go
defer func() {
  if r := recover(); r != nil {
    slog.Error("Task action panicked", "group", item.GroupFolder, "panic", r)
    item.ResultCh <- fmt.Errorf("task panicked: %v", r)
  } else {
    // ❌ 这个注释有歧义！
    // 如果没有 panic，ResultCh 应该已经在 action 结束后由外部或此处处理
    // 但由于 executeItem 是由 tryProcess 启动的协程，我们在这里闭环
  }
}()

err := item.Action()

// ✅ 实际上无论是否 panic，都会在这里发送 ResultCh
item.ResultCh <- err
```

**影响**: 代码注释可能误导开发者，认为 defer 函数负责发送 ResultCh，但实际上是在 defer 外部发送的！

---

## 🛠️ 3. 修复方案

---

### 修复方案 1: cli_anything 参数丢失修复

**修复方案**:
在匹配到自然语言关键词时，提取关键词**之后**的内容作为参数，然后追加到 `cmd` 后面！

**修复代码**:
```typescript
let command = prompt;
for (const [key, cmd] of Object.entries(fallbackCommands)) {
  const lowerPrompt = prompt.toLowerCase();
  const keyIndex = lowerPrompt.indexOf(key);
  if (keyIndex !== -1) {
    // ✅ 修复: 提取关键词之后的参数部分
    const argsPart = prompt.slice(keyIndex + key.length).trim();
    // ✅ 将参数追加到 cmd 后面
    command = argsPart ? `${cmd} ${argsPart}` : cmd;
    break;
  }
}
```

**需要修改的文件**:
1. `src/tools/cli-anything.ts` - 修复自然语言命令映射丢失参数

---

### 修复方案 2: process-executor.ts 临时文件名一致

**修复方案**:
将临时文件清理逻辑中的文件名模式从 `temp_exec_` 改为 `temp_`！

**修复代码**:
```typescript
// 第 206 行：清理临时文件
const argsStr = args.join(" ");
if (argsStr.includes("temp_")) {  // ✅ 改为 temp_，与创建时一致
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

### 修复方案 3: _parseArgsToObject 为 read_file 添加特殊处理

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

### 修复方案 4: runGit 重试机制修复

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
        return await new Promise((resolve) => {  // ✅ 添加 await！
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
        return await new Promise((resolve) => {  // ✅ 添加 await！
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

### 修复方案 5: GroupPool.executeItem 注释修复

**修复方案**:
更新 defer 函数中的注释，使其与实际代码逻辑一致！

**修复代码**:
```go
defer func() {
  if r := recover(); r != nil {
    slog.Error("Task action panicked", "group", item.GroupFolder, "panic", r)
    item.ResultCh <- fmt.Errorf("task panicked: %v", r)
  }
  // ✅ 移除有歧义的注释
  // ResultCh 会在 defer 外部发送（无论是否 panic）
}()

err := item.Action()

// Notify caller (if not already panicked)
item.ResultCh <- err
```

**需要修改的文件**:
1. `kernel/scheduler/pool.go` - 修复注释歧义

---

## 🔍 4. 影响范围与风险

### 4.1 受影响文件清单
| 文件 | 修改类型 | 说明 |
| :--- | :--- | :--- |
| `src/tools/cli-anything.ts` | 修改 | 修复自然语言命令映射丢失参数 |
| `src/sandbox/process-executor.ts` | 修改 | 修复临时文件名模式不一致 |
| `src/tools/tool-registry.ts` | 修改 | 为 read_file 添加特殊处理 |
| `src/utils/utils.ts` | 修改 | 修复 runGit 重试机制 |
| `kernel/scheduler/pool.go` | 修改 | 修复注释歧义 |

### 4.2 风险评估
| 风险项 | 严重程度 | 说明 |
| :--- | :--- | :--- |
| 问题 1 未修复时的功能问题 | 🟡 HIGH | cli_anything 工具无法正确处理带参数的命令 |
| 问题 2 未修复时的临时文件问题 | 🟡 MEDIUM | 临时文件可能无法被正确清理 |
| 问题 3 未修复时的参数解析问题 | 🟡 MEDIUM | 无法读取带空格的文件名 |
| 问题 4 未修复时的重试问题 | 🟢 LOW | Git 操作失败时不会自动重试 |
| 问题 5 未修复时的注释问题 | 🟢 LOW | 代码注释可能误导开发者 |

**总体评估**: 建议修复！这些都是影响用户体验和系统稳定性的运行时 Bug！

---

## 🗳️ 5. 投票表 (Quorum: 4)

### 协作主体投票
| 协作主体 | 态度 | 理由与风险评估 |
| :--- | :--- | :--- |
| Trae-CN | ✅ 赞同 | 发起者。本次深入审计发现 5 个运行时 Bug：1) 另一个协作主体发现的 cli_anything 参数丢失；2) process-executor.ts 临时文件名不一致；3) _parseArgsToObject 只对 write_file 有特殊处理；4) runGit 重试机制永远不会触发；5) GroupPool.executeItem 注释歧义。建议修复这些影响用户体验和系统稳定性的运行时 Bug。 |

### 用户投票
| 用户 | 态度 | 备注 |
| :--- | :--- | :--- |
| 用户 | | |

---

## 🕒 6. 更新日志
- 2026-04-01 - 创建提案 P031；专注于运行时 Bug 修复，发现 5 个问题。
