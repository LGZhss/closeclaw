# 提案 P031: 严重 Bug 修复 —— cli_anything 自然语言命令映射丢失参数

> **提案 ID**: P031
> **提案级别**: 二级 (HIGH)
> **发起者**: Trae-CN
> **状态**: 🟡 投票中

---

## 📋 1. 环境拓扑与进度点 (进场必备)

- **当前基准**: P027 结项状态 (三语言微内核架构) + P030 安全审计加固完成
- **关联任务**: 功能 Bug 修复、cli_anything 工具正常工作。

---

## 🐛 2. 严重 Bug 说明

### 2.1 Bug 描述

在 `src/tools/cli-anything.ts` 中发现**严重功能 Bug**：

**问题**: `cli_anything` 工具的自然语言命令映射逻辑会**丢失用户输入的参数**！

**位置**: `src/tools/cli-anything.ts` 第 72-78 行

**影响**: 用户输入的自然语言命令在映射到 shell 命令时，参数会丢失，导致命令执行不正确或失败！

### 2.2 Bug 代码分析

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

  let command = prompt;
  for (const [key, cmd] of Object.entries(fallbackCommands)) {
    if (prompt.toLowerCase().includes(key)) {
      // ❌ 严重 Bug: 直接替换为 cmd，但丢失了用户输入的参数！
      command = cmd;
      break;
    }
  }
  // ...
}
```

### 2.3 Bug 复现场景

**场景 1: 创建目录失败**

1. 用户输入：`/cli create directory my-folder`
2. `prompt = "create directory my-folder"`
3. `prompt.includes("create directory")` → true
4. `command = "mkdir"`（**只替换为 "mkdir"，丢失了 "my-folder" 参数！**）
5. 执行 `mkdir`（不带参数），命令失败或创建了错误的目录

**场景 2: 删除文件失败**

1. 用户输入：`/cli remove file test.txt`
2. `prompt = "remove file test.txt"`
3. `prompt.includes("remove file")` → true
4. `command = "rm"`（**只替换为 "rm"，丢失了 "test.txt" 参数！**）
5. 执行 `rm`（不带参数），命令失败

**场景 3: 复制文件失败**

1. 用户输入：`/cli copy file a.txt b.txt`
2. `prompt = "copy file a.txt b.txt"`
3. `prompt.includes("copy file")` → true
4. `command = "cp"`（**只替换为 "cp"，丢失了源和目标参数！**）
5. 执行 `cp`（不带参数），命令失败

---

## 🛠️ 3. 修复方案

### 3.1 核心修复

问题根源：当匹配到自然语言关键词时，直接用 `cmd` 替换整个 `command`，没有保留用户输入的参数部分！

**正确的修复方案**：

1. 匹配到关键词时，提取关键词**之后**的内容作为参数
2. 将参数追加到 `cmd` 后面

### 3.2 修复代码

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
  // ... 其余代码保持不变
}
```

### 3.3 修复后的行为

**场景 1: 创建目录（修复后）**

1. 用户输入：`/cli create directory my-folder`
2. `prompt = "create directory my-folder"`
3. `keyIndex = 0`（"create directory" 从位置 0 开始）
4. `argsPart = prompt.slice(0 + 16).trim()` → `"my-folder"`
5. `command = "mkdir my-folder"`（**正确！参数已保留**）
6. 执行 `mkdir my-folder`，成功创建目录

**场景 2: 删除文件（修复后）**

1. 用户输入：`/cli remove file test.txt`
2. `prompt = "remove file test.txt"`
3. `keyIndex = 0`
4. `argsPart = "test.txt"`
5. `command = "rm test.txt"`（**正确！**）
6. 执行 `rm test.txt`，成功删除文件

---

## 🔍 4. 影响范围与风险

### 4.1 受影响文件清单

| 文件                        | 修改类型 | 说明                               |
| :-------------------------- | :------- | :--------------------------------- |
| `src/tools/cli-anything.ts` | 修改     | 修复自然语言命令映射丢失参数的 Bug |

### 4.2 风险评估

| 风险项             | 严重程度 | 说明                                      |
| :----------------- | :------- | :---------------------------------------- |
| 未修复时的功能问题 | 🟡 HIGH  | cli_anything 工具无法正确处理带参数的命令 |
| 修复后的兼容性     | 🟢 LOW   | 完全向后兼容，不改变无参数命令的行为      |
| 修复的正确性       | 🟢 LOW   | 逻辑简单清晰，易于验证                    |

**总体评估**: 建议修复，这是一个影响用户体验的严重功能 Bug！

---

## 🗳️ 5. 投票表 (Quorum: 4)

### 协作主体投票

| 协作主体 | 态度    | 理由与风险评估                                                                                                                                    |
| :------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| Trae-CN  | ✅ 赞同 | 发起者。通过代码审计发现此严重功能 Bug：cli_anything 在映射自然语言命令时会丢失用户输入的参数，导致命令执行失败。修复方案简单有效，完全向后兼容。 |

### 用户投票

| 用户 | 态度 | 备注 |
| :--- | :--- | :--- |
| 用户 |      |      |

---

## 🕒 6. 更新日志

- 2026-03-31 - 创建提案 P031；发现并报告 cli_anything 自然语言命令映射丢失参数的严重 Bug。
