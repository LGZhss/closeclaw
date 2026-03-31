# 提案 P031: cli_anything 综合修复 —— 严重功能 Bug + 重大安全漏洞

> **提案 ID**: P031
> **提案级别**: 一级 (CRITICAL)
> **发起者**: Trae-CN
> **状态**: 🔴 紧急待处理

---

## 📋 1. 环境拓扑与进度点 (进场必备)

- **当前基准**: P027 结项状态 (三语言微内核架构) + P030 安全审计加固完成
- **关联任务**: 功能 Bug 修复、安全漏洞修复、cli_anything 工具加固。

---

## 🚨 2. 问题说明（包含 Bug 和 漏洞）

### 2.1 问题 A: 严重功能 Bug

**来源**: 另一个协作主体发现（是 Bug，不是漏洞）

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

**Bug 复现场景**:

- 用户输入: `/cli create directory my-folder`
- 结果: 执行 `mkdir`（**不带参数**）而不是 `mkdir my-folder`

---

### 2.2 问题 B: 重大安全漏洞

**来源**: 本次审计发现（是真正的漏洞！）

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

**漏洞攻击向量**:

1. 用户在 Telegram 中发送：`/cli cat .env`
2. `cli_anything` 接收 prompt = "cat .env"
3. prompt 不包含任何 fallbackCommands 的 key → command = "cat .env"
4. baseCommand = "cat" 在 allowedCommands 中 ✓
5. command = "cat .env" 不含元字符 → 检查通过 ✓
6. **直接执行 `cat .env`，返回所有 API 密钥！**

---

## 🛠️ 3. 修复方案

### 3.1 问题 A (功能 Bug) 修复

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

### 3.2 问题 B (安全漏洞) 修复

问题根源：`cli_anything` 目前的设计本质上是不安全的！它允许白名单命令的任意参数！

**推荐方案（参考 P030）**: 物理删除 `cli_anything` 工具

因为：

1. 这个工具的设计理念就是"用自然语言执行任意命令"，本质上不安全
2. 即使修复了白名单，用户仍然可以通过 `cat`、`grep` 等命令读取敏感文件
3. 参考 P030 的做法，物理删除 `execute_command` 工具，保持一致

**需要修改的文件**:

1. `src/tools/cli-anything.ts` - 删除或禁用
2. `src/tools/tool-definitions.ts` - 移除 cli_anything 定义
3. `src/tools/tool-registry.ts` - 移除 cliAnything handler

---

## 🔍 4. 影响范围与风险

### 4.1 受影响文件清单

| 文件                            | 修改类型  | 说明                        |
| :------------------------------ | :-------- | :-------------------------- |
| `src/tools/cli-anything.ts`     | 删除/禁用 | 修复 Bug 并移除不安全的工具 |
| `src/tools/tool-definitions.ts` | 修改      | 移除 cli_anything 定义      |
| `src/tools/tool-registry.ts`    | 修改      | 移除 cliAnything handler    |

### 4.2 风险评估

| 风险项                    | 严重程度    | 说明                                         |
| :------------------------ | :---------- | :------------------------------------------- |
| 问题 B 未修复时的漏洞利用 | 🔴 CRITICAL | 可执行任意命令，读取/删除任何文件            |
| 问题 A 未修复时的功能问题 | 🟡 HIGH     | cli_anything 工具无法正确处理带参数的命令    |
| 修复后的兼容性            | 🟡 MEDIUM   | 会影响 cli_anything 工具的使用，但安全更重要 |

**总体评估**: 必须立即修复！问题 B 是一个可导致完全系统接管的重大安全漏洞！

---

## 🗳️ 5. 投票表 (Quorum: 2)

### 协作主体投票

| 协作主体 | 态度    | 理由与风险评估                                                                                                                                                                                            |
| :------- | :------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trae-CN  | ✅ 赞同 | 发起者。本次修复包含两个问题：1) 另一个协作主体发现的严重功能 Bug（自然语言命令映射丢失参数）；2) 本次审计发现的重大安全漏洞（cli_anything 可执行任意命令）。建议参考 P030 的做法，物理删除此不安全工具。 |

### 用户投票

| 用户 | 态度 | 备注 |
| :--- | :--- | :--- |
| 用户 |      |      |

---

## 🕒 6. 更新日志

- 2026-03-31 - 创建提案 P031；合并两个问题：功能 Bug 修复 + 重大安全漏洞修复。
