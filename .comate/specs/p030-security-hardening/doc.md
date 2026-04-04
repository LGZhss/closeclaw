# P030: 安全审计加固 — 全维度漏洞修复

## 概述

基于完整安全审计报告，对 CloseClaw 系统进行全方位安全加固，覆盖 TypeScript 沙盒层、Go 内核层和 CI/CD 工作流。共修复 15 个已确认漏洞，排除 2 个误报和 1 个 OS 层级问题。

## 设计决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| `executeSystemCommand` 处置 | **方案 A: 直接删除** | `cli-anything` 已提供更安全的替代方案，`/exec` 工具零验证直通 shell 是最高危漏洞 |
| `mirror.yml` 自动 PR | **废除** | 存在命令注入和无审核合并风险，改为仅单向镜像推送 |
| Named Pipe ACL | **添加安全描述符** | 限制为当前用户 SID，利用已有的 go-winio 依赖 |

---

## 组件 1: 命令执行安全加固 (CRITICAL)

### 1.1 删除 `executeSystemCommand` 和 `execAsync`

**文件**: `src/utils/utils.ts`

- 删除 `executeSystemCommand()` 函数 (L13-34) — 任意 shell 命令执行入口
- 删除 `execAsync()` 函数 (L39-83) — 脆弱的手写命令解析器 + 死代码
- 移除 `spawn` import（仅被上述两函数使用）

**文件**: `src/tools/tool-registry.ts`

- 移除 `executeSystemCommand` import (L12)
- 删除 `execCommand` handler 绑定 (L29)
- 删除 `execCommand` 方法 (L107-110)
- 删除 `_parseArgsToObject` 中 `execute_command` 特殊处理 (L91-93)

**文件**: `src/tools/tool-definitions.ts`

- 删除 `execute_command` 工具定义 (L7-20)

### 1.2 加固 `fetchUrl` — SSRF 防护

**文件**: `src/utils/utils.ts:125-135`

```typescript
export async function fetchUrl(url: string): Promise<string> {
  // SSRF 防护：仅允许 http/https scheme
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`URL scheme not allowed: ${parsed.protocol}`);
  }

  // 禁止私网 IP 和云元数据地址
  const hostname = parsed.hostname;
  const blockedPatterns = [
    /^127\.\d+\.\d+\.\d+$/,
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^169\.254\.\d+\.\d+$/,
    /^0\.0\.0\.0$/,
    /^localhost$/,
    /^\[::1\]$/,
  ];
  if (blockedPatterns.some((p) => p.test(hostname))) {
    throw new Error(`Access to private/internal network is blocked: ${hostname}`);
  }

  // 响应大小限制 1MB
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 1_048_576) {
    throw new Error("Response too large (max 1MB)");
  }

  const text = await response.text();
  if (text.length > 1_048_576) {
    throw new Error("Response body too large (max 1MB)");
  }
  return text;
}
```

### 1.3 加固 `writeWsFile` — 敏感文件保护

**文件**: `src/utils/utils.ts:103-120`

在 `writeWsFile` 中添加路径检查，拒绝写入以下敏感路径：

```typescript
const PROTECTED_PATHS = [
  ".git",
  ".env",
  ".env.local",
  ".env.production",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  ".gitignore",
  ".gitattributes",
  "node_modules",
];

export async function writeWsFile(filePath: string, content: string): Promise<string> {
  const normalized = filePath.replace(/\\/g, "/").replace(/^\.\/+/, "");
  for (const protectedPath of PROTECTED_PATHS) {
    if (normalized === protectedPath || normalized.startsWith(protectedPath + "/")) {
      return `Access denied: ${filePath} is a protected path`;
    }
  }
  // ... 原有逻辑
}
```

### 1.4 加固 `TRIGGER_PATTERN` — 正则注入防护

**文件**: `src/config.ts:17`

```typescript
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const TRIGGER_PATTERN = new RegExp(`^@${escapeRegExp(ASSISTANT_NAME)}\\b`, "i");
```

---

## 组件 2: 沙盒执行器加固 (CRITICAL)

### 2.1 `ProcessExecutor.execute()` — 添加权限限制

**文件**: `src/sandbox/process-executor.ts:37-74`

- 添加代码大小限制 (10KB)
- 传入 `--no-warnings` 标志减少信息泄露
- 日志脱敏：不记录代码内容，仅记录执行 ID 和长度

```typescript
const MAX_CODE_SIZE = 10_240; // 10KB

async execute(code: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
  if (code.length > MAX_CODE_SIZE) {
    throw new Error(`Code too large: ${code.length} bytes (max ${MAX_CODE_SIZE})`);
  }
  // ... 原有逻辑，日志仅记录 executionId 和代码长度
}
```

### 2.2 `ProcessExecutor.executeCommand()` — 日志脱敏

**文件**: `src/sandbox/process-executor.ts:177-179`

```typescript
// 脱敏：仅显示命令前 50 字符
const safeCmd = displayCmd.length > 50 ? displayCmd.slice(0, 50) + "..." : displayCmd;
logger.debug(`[ProcessExecutor] 命令执行完成: ${safeCmd}，退出码: ${exitCode}`);
```

### 2.3 `cli-anything.ts` — 完善元字符过滤

**文件**: `src/tools/cli-anything.ts:80`

扩展 shell 元字符检测正则：

```typescript
// 原: /[;&|`<>$]/
// 加固: 添加 \n, \r, (, ), {}, \ 以及反引号
if (/[;&|`<>$()\n\r{}\^]/.test(command)) {
  throw new Error(`检测到非法的 shell 元字符: ${command}`);
}
```

日志脱敏：

```typescript
const safePrompt = prompt.length > 80 ? prompt.slice(0, 80) + "..." : prompt;
logger.info(`[CLI-Anything] 执行命令: ${safePrompt} 在目录: ${safeDir}`);
```

### 2.4 `manager.ts` — 日志脱敏

**文件**: `src/sandbox/manager.ts:94`

```typescript
const safeCmd = command.length > 50 ? command.slice(0, 50) + "..." : command;
logger.info(`[Sandbox] 尝试使用子进程执行命令: ${safeCmd}`);
```

---

## 组件 3: 配置加固 (MEDIUM)

### 3.1 `tsconfig.json` — 移除 `allowJs`

**文件**: `tsconfig.json:22`

```json
// 删除 "allowJs": true
```

---

## 组件 4: Go 内核加固 (MEDIUM)

### 4.1 `router.go` — 正则注入防护

**文件**: `kernel/router/router.go:26`

```go
TriggerPattern: regexp.MustCompile("(?i)^@" + regexp.QuoteMeta(assistantName) + "\\b"),
```

### 4.2 `main.go` — `loadEnv` 引号裁剪

**文件**: `kernel/main.go:36`

```go
val := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
```

### 4.3 `listen_windows.go` — Named Pipe ACL

**文件**: `kernel/server/listen_windows.go:12-15`

```go
import (
    "log/slog"
    "net"
    "os/user"
    "syscall"

    "github.com/Microsoft/go-winio"
    "golang.org/x/sys/windows"
)

func listen() (net.Listener, error) {
    slog.Info("Windows 平台：启用物理命名管道监听", "pipe", pipePath)

    currentUser, err := user.Current()
    if err != nil {
        slog.Warn("获取当前用户失败，使用默认权限", "err", err)
        return winio.ListenPipe(pipePath, nil)
    }

    sid, err := syscall.StringToSid(currentUser.Uid)
    if err != nil {
        slog.Warn("SID 解析失败，使用默认权限", "err", err)
        return winio.ListenPipe(pipePath, nil)
    }

    sd, err := winio.SddlToSecurityDescriptor("D:" + // DACL
        "A;;GA;;;" + currentUser.Uid + // 授予当前用户完全控制
        "D:NO_ACCESS_CONTROLS") // 拒绝其他所有用户
    if err != nil {
        slog.Warn("安全描述符构建失败，使用默认权限", "err", err)
        return winio.ListenPipe(pipePath, nil)
    }

    _ = sid // sid 已通过 Uid 构建 SDDL
    config := &winio.PipeConfig{
        SecurityDescriptor: sd,
    }
    return winio.ListenPipe(pipePath, config)
}
```

---

## 组件 5: CI/CD 工作流加固 (HIGH)

### 5.1 固定第三方 Action SHA

**文件** | **变更**
--------|----------
`sonarcloud.yml:41` | `sonarsource/sonarcloud-github-action@master` → 固定 SHA
`snyk.yml:24` | `snyk/actions/node@master` → 固定 SHA
`codacy-analysis.yml:21` | `codacy/codacy-analysis-cli-action@master` → 固定 SHA
`mirror.yml:28` | `Yikun/hub-mirror-action@master` → 固定 SHA

> SHA 将在实施阶段通过 `git ls-remote` 获取各仓库最新 commit。

### 5.2 `mirror.yml` — 权限 + 安全修复

- 添加 `permissions: contents: read` 最小权限
- 废除自动创建 PR 逻辑 (L68-81)
- 修复分支名引用加引号

### 5.3 `code_quality.yml` — 添加 harden-runner

添加 `step-security/harden-runner@v2` 步骤。

---

## 影响范围

| 修改文件 | 类型 | 受影响调用方 |
|----------|------|-------------|
| `src/utils/utils.ts` | MODIFY | tool-registry.ts (删除 exec 引用) |
| `src/tools/tool-registry.ts` | MODIFY | LLM tool execution path |
| `src/tools/tool-definitions.ts` | MODIFY | LLM tool list |
| `src/sandbox/process-executor.ts` | MODIFY | sandbox/manager.ts |
| `src/sandbox/manager.ts` | MODIFY | cli-anything.ts |
| `src/tools/cli-anything.ts` | MODIFY | tool-registry.ts |
| `src/config.ts` | MODIFY | router.ts, trigger detection |
| `tsconfig.json` | MODIFY | TypeScript compilation |
| `kernel/router/router.go` | MODIFY | Go kernel router |
| `kernel/main.go` | MODIFY | Go kernel startup |
| `kernel/server/listen_windows.go` | MODIFY | Go kernel gRPC listener |
| `.github/workflows/sonarcloud.yml` | MODIFY | CI |
| `.github/workflows/snyk.yml` | MODIFY | CI |
| `.github/workflows/codacy-analysis.yml` | MODIFY | CI |
| `.github/workflows/mirror.yml` | MODIFY | CI/CD |
| `.github/workflows/code_quality.yml` | MODIFY | CI |

## 验证计划

```bash
npm run typecheck    # 类型检查通过
npm test             # 现有测试不受影响
npm run format:check # 格式合规
```

手动验证：
- `fetchUrl` 拒绝 `file://`、`http://169.254.169.254`、`http://127.0.0.1`
- `writeWsFile` 拒绝 `.git/config`、`.env` 等路径
- `cli-anything` 元字符过滤拦截 `\n`、`()`
- CI workflow diff 中 Action 引用为 SHA
