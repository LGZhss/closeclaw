# 提案 P031: 重大漏洞修复 —— cli_anything 白名单绕过导致任意命令执行

> **提案 ID**: P031
> **提案级别**: 一级 (CRITICAL)
> **发起者**: Trae-CN
> **状态**: 🔴 紧急待处理

---

## 📋 1. 环境拓扑与进度点 (进场必备)

- **当前基准**: P027 结项状态 (三语言微内核架构) + P030 安全审计加固完成
- **关联任务**: 重大安全漏洞修复、命令执行权限控制。

---

## 🚨 2. 重大漏洞说明

### 2.1 漏洞描述

在 `src/tools/cli-anything.ts` 中发现**CRITICAL 级别漏洞**：

**问题**: `cli_anything` 工具的白名单机制可以被完全绕过，攻击者可以执行任意 shell 命令！

**位置**: `src/tools/cli-anything.ts` 第 72-102 行

**影响**: 攻击者可以通过 Telegram 发送 `/cli cat .env` 或 `/cli rm -rf /` 等命令，获取 API 密钥或完全破坏系统！

### 2.2 漏洞代码分析

```typescript
async function executeCliAnything(
  prompt: string,
  workDir: string,
  timeout: number,
) {
  const fallbackCommands: Record<string, string> = {
    "list files": "ls -la",
    "show directory": "pwd",
    "create directory": "mkdir",
    "remove file": "rm",
    "copy file": "cp",
    "move file": "mv",
  };

  // ❌ 问题 1: 如果 prompt 不包含任何 fallbackCommands 的 key，command = prompt 原样保留！
  let command = prompt;
  for (const [key, cmd] of Object.entries(fallbackCommands)) {
    if (prompt.toLowerCase().includes(key)) {
      command = cmd;
      break;
    }
  }

  const baseCommand = command.trim().split(/\s+/)[0];

  // ❌ 问题 2: 元字符检查在 baseCommand 提取之后！
  // 但如果用户直接输入 "cat .env"，baseCommand = "cat" 在白名单中，检查通过！
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

  // ❌ 问题 3: 如果用户输入 "cat .env"，baseCommand = "cat" 在白名单中！
  // 然后直接执行完整的 command = "cat .env"！
  if (!allowedCommands.has(baseCommand)) {
    throw new Error(`命令不在白名单中: ${baseCommand}`);
  }

  // ⚠️ 直接执行完整的 command！包括所有参数！
  return await sandboxManager.executeCommand(command, {
    cwd: workDir,
    timeout,
  });
}
```

### 2.3 攻击向量

**攻击 1: 读取敏感文件**

1. 用户在 Telegram 中发送：`/cli cat .env`
2. `cli_anything` 接收 prompt = "cat .env"
3. prompt 不包含任何 fallbackCommands 的 key → command = "cat .env"
4. baseCommand = "cat" 在 allowedCommands 中 ✓
5. command = "cat .env" 不含元字符 → 检查通过 ✓
6. **直接执行 `cat .env`，返回所有 API 密钥！**

**攻击 2: 删除文件**

1. 用户在 Telegram 中发送：`/cli rm important.txt`
2. 同样的逻辑 → 直接执行 `rm important.txt`

**攻击 3: 链式命令（虽然有元字符检查，但参数可以是任意的）**
即使有元字符检查，白名单命令的参数也可以造成危害：

- `/cli grep secret *` - 搜索所有文件中的 secret
- `/cli find . -name "*.env"` - 查找所有 .env 文件

---

## 🛠️ 3. 修复方案

### 3.1 核心修复

问题根源：`cli_anything` 目前的实现是**假的安全过滤**！它允许白名单命令的任意参数！

**正确的修复方案**：

1. **完全移除 fallbackCommands 逻辑**（这是混淆视听的）
2. **只允许纯自然语言输入，不允许直接输入命令**
3. **或者，严格限制参数，不允许直接传递任意参数**

### 3.2 修复代码（推荐方案）

```typescript
async function executeCliAnything(
  prompt: string,
  workDir: string,
  timeout: number,
) {
  // ✅ 方案 1: 只使用自然语言映射，不允许直接输入命令
  // 或者，参考 P030 的做法，物理删除这个工具
  // 或者，完全重新设计，只允许预定义的安全操作

  // 当前推荐：与 P030 保持一致，物理删除 cli_anything 工具
  // 因为它的设计本质上就是不安全的！
  throw new Error("cli_anything tool has been disabled for security reasons");
}
```

**或者更保守的方案**：

```typescript
async function executeCliAnything(
  prompt: string,
  workDir: string,
  timeout: number,
) {
  // ✅ 只允许预定义的自然语言命令，不接受任意命令
  const safeCommands: Record<string, () => Promise<ExecutionResult>> = {
    "list files": () =>
      sandboxManager.executeCommand("ls -la", { cwd: workDir, timeout }),
    "show directory": () =>
      sandboxManager.executeCommand("pwd", { cwd: workDir, timeout }),
    // 只允许不带参数的固定命令
  };

  for (const [key, cmdFn] of Object.entries(safeCommands)) {
    if (prompt.toLowerCase().trim() === key.toLowerCase()) {
      return await cmdFn();
    }
  }

  throw new Error("Only predefined natural language commands are allowed");
}
```

### 3.3 需要同时修改的文件

1. `src/tools/cli-anything.ts` - 修复或删除
2. `src/tools/tool-definitions.ts` - 移除 cli_anything 定义（如果选择删除）
3. `src/tools/tool-registry.ts` - 移除 cliAnything handler（如果选择删除）

---

## 🔍 4. 影响范围与风险

### 4.1 受影响文件清单

| 文件                            | 修改类型  | 说明                             |
| :------------------------------ | :-------- | :------------------------------- |
| `src/tools/cli-anything.ts`     | 修改/删除 | 修复或移除不安全的 cli_anything  |
| `src/tools/tool-definitions.ts` | 修改      | （可选）移除 cli_anything 定义   |
| `src/tools/tool-registry.ts`    | 修改      | （可选）移除 cliAnything handler |

### 4.2 风险评估

| 风险项             | 严重程度    | 说明                                         |
| :----------------- | :---------- | :------------------------------------------- |
| 未修复时的漏洞利用 | 🔴 CRITICAL | 可执行任意命令，读取/删除任何文件            |
| 修复后的兼容性     | 🟡 MEDIUM   | 会影响 cli_anything 工具的使用，但安全更重要 |
| 修复的正确性       | 🟢 LOW      | 参考 P030 物理删除 execute_command 的模式    |

**总体评估**: 必须立即修复！这是一个可导致完全系统接管的重大漏洞！

---

## 🗳️ 5. 投票表 (Quorum: 2)

### 协作主体投票

| 协作主体 | 态度    | 理由与风险评估                                                                                                                                  |
| :------- | :------ | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| Trae-CN  | ✅ 赞同 | 发起者。通过代码审计发现此 CRITICAL 漏洞：cli_anything 的白名单机制完全无效，攻击者可执行任意命令。建议参考 P030 的做法，物理删除此不安全工具。 |

### 用户投票

| 用户 | 态度 | 备注 |
| :--- | :--- | :--- |
| 用户 |      |      |

---

## 🕒 6. 更新日志

- 2026-03-31 - 创建提案 P031；发现并报告 cli_anything 重大安全漏洞。
