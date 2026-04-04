# Design Document

## Overview

本设计文档描述了Governance Build Reconstruction & Hardening的技术方案，整合了P031（6个变体）的所有修复、核心文件恢复、TypeScript严格合规以及P033未完成的CI/CD加固。设计遵循"安全优先、渐进修复、零回归"的原则。

## Architecture Context

### 当前架构状态（P027三语言微内核）

```
┌─────────────────────────────────────┐
│ 层 1: 控制平面 (Dart)                │
│ - 守护进程 & CLI                     │
│ - MCP Server                         │
│ - TraceID 生成                       │
└─────────────────────────────────────┘
          ↓ (gRPC Named Pipe)
┌─────────────────────────────────────┐
│ 层 2: 状态总线 (Go)                  │
│ - go-sqlite3 总线                    │
│ - LLM API 网络中枢                   │
│ - 任务调度器                         │
└─────────────────────────────────────┘
          ↓ (Named Pipe / IPC)
┌─────────────────────────────────────┐
│ 层 3: 哑终端沙盒 (TypeScript) ← 本次修复重点 │
│ - NPM 生态执行器                     │
│ - Telegram 增强                      │
│ - MCP 工具桥接                       │
└─────────────────────────────────────┘
```

### 问题根源分析

**核心问题**: TypeScript层（Layer 3）在重构过程中丢失了关键模块，导致：
1. **编译失败** - 缺少 `src/bus/grpc-client.ts` 和 `src/adapters/registry.ts`
2. **安全漏洞** - P030安全加固不完整，cli_anything和readWsFile存在绕过
3. **技术债务** - 多个运行时Bug和代码质量问题累积

## Design Decisions

### 决策1: 核心模块恢复策略

**问题**: `src/bus/grpc-client.ts` 和 `src/adapters/registry.ts` 在历史提交中不存在

**方案**: 基于P027架构规范，全新创建这两个模块

**理由**:
- P027明确定义了三层架构的接口契约
- TypeScript层需要通过gRPC与Go内核通信
- LLM适配器需要统一的注册和调用机制

**实现**:

#### src/bus/grpc-client.ts 设计

```typescript
/**
 * gRPC内核总线客户端
 * 负责与Go层的状态总线通信
 */

export interface BusMessage {
  type: "EXEC_SANDBOX" | "LLM_CHAT" | "HEALTH_CHECK";
  payload: any;
  traceId: string;
}

export interface BusClientOptions {
  target: string; // Named Pipe 或 Unix Socket 路径
}

export class GrpcKernelBusClient {
  public readonly target: string;
  private messageHandler?: (msg: BusMessage) => Promise<any>;

  constructor(options: BusClientOptions) {
    this.target = options.target;
  }

  async connect(): Promise<void> {
    // 实现gRPC连接逻辑
    // 强制使用Named Pipe/Unix Socket，不回退到TCP
  }

  onMessage(handler: (msg: BusMessage) => Promise<any>): void {
    this.messageHandler = handler;
  }

  async send(message: BusMessage): Promise<any> {
    // 发送消息到Go内核
  }

  async close(): Promise<void> {
    // 关闭连接
  }
}
```

#### src/adapters/registry.ts 设计

```typescript
/**
 * LLM适配器注册表
 * 管理多个LLM提供商的适配器
 */

export interface LLMAdapter {
  name: string;
  chat(params: any): Promise<any>;
}

export class LLMAdapterRegistry {
  private adapters: Map<string, LLMAdapter>;

  constructor() {
    this.adapters = new Map();
    this.registerDefaultAdapters();
  }

  private registerDefaultAdapters(): void {
    // 注册默认适配器（OpenRouter, Anthropic等）
  }

  register(adapter: LLMAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  get(name: string): LLMAdapter {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new Error(`LLM adapter not found: ${name}`);
    }
    return adapter;
  }
}
```

### 决策2: 安全漏洞修复策略

**问题**: cli_anything和readWsFile存在CRITICAL级别安全漏洞

**方案**: 
1. **cli_anything** - 物理删除（参考P030删除execute_command的做法）
2. **readWsFile** - 添加PROTECTED_PATHS检查

**理由**:
- cli_anything的设计本质上不安全（允许白名单命令的任意参数）
- 即使修复参数丢失Bug，仍然可以通过 `cat .env`、`grep secret *` 等读取敏感文件
- P030已经删除了execute_command，保持一致性
- readWsFile应该与writeWsFile使用相同的保护机制

**实现**:

#### cli_anything 删除方案

```typescript
// src/tools/cli-anything.ts - 完全删除此文件

// src/tools/tool-definitions.ts - 移除cli_anything定义
export const toolDefinitions = [
  // ... 其他工具
  // ❌ 删除: cliAnythingTool
];

// src/tools/tool-registry.ts - 移除cliAnything handler
export const createToolRegistry = (...) => {
  return {
    // ... 其他工具
    // ❌ 删除: cli_anything handler
  };
};
```

#### readWsFile 加固方案

```typescript
// src/utils/utils.ts

const PROTECTED_PATHS = [
  ".env",
  ".env.local",
  ".env.production",
  ".git",
  "node_modules",
  ".kiro/settings",
  // ... 其他敏感路径
];

export async function readWsFile(filePath: string): Promise<string> {
  // ✅ 新增：PROTECTED_PATHS检查（与writeWsFile一致）
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
    return await fsPromises.readFile(fullPath, "utf8");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error reading ${filePath}: ${message}`);
    throw error;
  }
}
```

### 决策3: 运行时Bug修复策略

**问题**: 6个运行时Bug影响功能和代码质量

**方案**: 逐个修复，优先级从高到低

#### Bug 3.1: 临时文件名不一致

```typescript
// src/sandbox/process-executor.ts

// 创建临时文件（第52行）
const tempFile = path.join(os.tmpdir(), `temp_${executionId}.js`);

// 清理临时文件（第206行）
const argsStr = args.join(" ");
if (argsStr.includes("temp_")) {  // ✅ 改为 temp_，与创建时一致
  const tempPath = args.find((a) => a.includes("temp_"));
  if (tempPath && fs.existsSync(tempPath)) {
    try {
      fs.unlinkSync(tempPath);
    } catch {}
  }
}
```

#### Bug 3.2: read_file参数解析

```typescript
// src/tools/tool-registry.ts

private _parseArgsToObject(tool: any, args: string[], rawText: string) {
  const props = tool.parameters.properties || {};
  const propNames = Object.keys(props);

  if (tool.name === "write_file") {
    const match = rawText.match(/^\/write\s+(\S+)\s+([\s\S]*)$/i);
    if (match) {
      return { filePath: match[1], content: match[2] };
    }
  }

  // ✅ 新增：为read_file添加特殊处理
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

#### Bug 3.3: runGit重试机制

```typescript
// src/utils/utils.ts

export async function runGit(
  action: "backup" | "sync",
  message?: string,
  retries = 3,
): Promise<string> {
  const attempt = async (count: number): Promise<string> => {
    try {
      if (action === "backup") {
        const msg = message || `Backup at ${new Date().toISOString()}`;
        return await new Promise((resolve) => {  // ✅ 添加 await
          const add = spawn("git", ["add", "."], { cwd: WORKSPACE });
          // ... 其余逻辑
        });
      } else {
        return await new Promise((resolve) => {  // ✅ 添加 await
          const pull = spawn("git", ["pull"], { cwd: WORKSPACE });
          // ... 其余逻辑
        });
      }
    } catch (error: unknown) {
      if (count > 0) {
        const delay = (4 - count) * 2000;
        logger.warn(`Git operation failed, retrying in ${delay}ms...`);
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

#### Bug 3.4-3.6: TypeScript未使用变量

```typescript
// src/sandbox/manager.ts
// ✅ 方案1: 实际使用safeStdout
logger.debug(`[Sandbox] Output preview (${traceId}): ${safeStdout}`);

// ✅ 方案2: 移除未使用的变量
// 删除 const safeStdout = ... 这一行

// src/tools/tool-registry.ts
// ✅ 移除未使用的导入
import { readWsFile, writeWsFile } from "../utils/utils.js";  // 删除safeCmd

// ✅ 标记有意未使用的参数
list_dir: async ({ path: _dirPath }) => {  // 使用下划线前缀
  return { files: ["."] };
},
```

### 决策4: CI/CD加固策略（P033未完成部分）

**问题**: P033规划的4项CI/CD加固未执行

**方案**: 创建配置文件并修改工作流

#### 4.1: 创建.snyk配置

```yaml
# .snyk
version: v1.25.0
ignore:
  # 示例：忽略开发依赖的低严重性漏洞
  'SNYK-JS-EXAMPLE-123456':
    - '*':
        reason: 'Dev dependency, not in production'
        expires: '2026-12-31T23:59:59.000Z'
```

#### 4.2: SonarCloud Quality Gate等待

```yaml
# .github/workflows/sonarcloud.yml
- name: SonarCloud Scan
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  run: |
    npx sonar-scanner \
      -Dsonar.projectKey=closeclaw \
      -Dsonar.organization=your-org \
      -Dsonar.qualitygate.wait=true  # ✅ 新增：等待Quality Gate结果
```

#### 4.3: Snyk严重性阈值

```yaml
# .github/workflows/snyk.yml
- name: Run Snyk Security Scan
  run: |
    npx snyk test \
      --severity-threshold=high \  # ✅ 新增：只报告high及以上
      --json > snyk-results.json
```

#### 4.4: Cosign仅在Release时触发

```yaml
# .github/workflows/sigstore-cosign.yml
on:
  release:  # ✅ 修改：从push改为release
    types: [published]
```

## Implementation Strategy

### 阶段1: 核心模块恢复（P0优先级）

1. 创建 `src/bus/grpc-client.ts` - 基础实现
2. 创建 `src/adapters/registry.ts` - 基础实现
3. 修复 `src/index.ts` 的类型错误
4. 验证编译通过: `npm run typecheck`

### 阶段2: 安全漏洞修复（P0优先级）

1. 物理删除 `src/tools/cli-anything.ts`
2. 从 `tool-definitions.ts` 和 `tool-registry.ts` 移除cli_anything
3. 为 `readWsFile` 添加PROTECTED_PATHS检查
4. 运行安全测试验证修复

### 阶段3: 运行时Bug修复（P1-P2优先级）

1. 修复临时文件名不一致（Bug 3.1）
2. 为read_file添加参数解析（Bug 3.2）
3. 修复runGit重试机制（Bug 3.3）
4. 清理未使用变量（Bug 3.4-3.6）
5. 验证所有测试通过: `npm test`

### 阶段4: CI/CD加固（P3优先级）

1. 创建 `.snyk` 配置文件
2. 修改 `sonarcloud.yml` 添加Quality Gate等待
3. 修改 `snyk.yml` 添加严重性阈值
4. 修改 `sigstore-cosign.yml` 改为Release触发
5. 验证CI/CD流程正常

## Testing Strategy

### 单元测试

```typescript
// tests/bus/grpc-client.test.ts
describe("GrpcKernelBusClient", () => {
  it("should connect to Named Pipe on Windows", async () => {
    // 测试Windows Named Pipe连接
  });

  it("should connect to Unix Socket on Linux", async () => {
    // 测试Unix Socket连接
  });
});

// tests/adapters/registry.test.ts
describe("LLMAdapterRegistry", () => {
  it("should register and retrieve adapters", () => {
    // 测试适配器注册和获取
  });
});

// tests/utils/utils.test.ts
describe("readWsFile", () => {
  it("should reject reading .env file", async () => {
    await expect(readWsFile(".env")).rejects.toThrow("Access denied");
  });

  it("should reject reading .git directory", async () => {
    await expect(readWsFile(".git/config")).rejects.toThrow("Access denied");
  });
});
```

### 集成测试

```typescript
// tests/integration/sandbox-bus.test.ts
describe("Sandbox-Bus Integration", () => {
  it("should execute sandbox task via bus", async () => {
    // 测试通过bus执行沙盒任务
  });
});
```

### 安全测试

```typescript
// tests/security/protected-paths.test.ts
describe("Protected Paths Security", () => {
  it("should prevent reading .env via read_file tool", async () => {
    // 测试read_file工具无法读取.env
  });

  it("should prevent reading .git via readWsFile", async () => {
    // 测试readWsFile无法读取.git
  });
});
```

## Rollback Plan

如果修复导致严重问题：

1. **立即回滚**: `git revert <commit-hash>`
2. **恢复分支**: `git checkout governance/consolidated-bolt-fixes`
3. **重新评估**: 分析失败原因，调整修复方案
4. **渐进修复**: 将大修复拆分为多个小修复，逐个验证

## Success Criteria

### 编译成功

- ✅ `npm run typecheck` 零错误
- ✅ `npm run build` 成功生成dist/
- ✅ 所有TypeScript文件通过严格模式检查

### 安全加固

- ✅ cli_anything工具完全移除
- ✅ readWsFile无法读取.env、.git等敏感文件
- ✅ Snyk和SonarCloud扫描无CRITICAL漏洞

### 功能正常

- ✅ `npm test` 所有测试通过
- ✅ 沙盒执行功能正常
- ✅ LLM适配器调用正常
- ✅ 临时文件正确清理

### CI/CD完善

- ✅ .snyk配置生效
- ✅ SonarCloud Quality Gate阻塞失败构建
- ✅ Snyk只报告high及以上漏洞
- ✅ Cosign只在Release时执行

## Risk Assessment

| 风险项 | 严重程度 | 缓解措施 |
|--------|---------|---------|
| 新创建的模块与Go层不兼容 | 🟡 MEDIUM | 严格遵循P027接口规范，编写集成测试 |
| 删除cli_anything影响现有用户 | 🟢 LOW | P030已删除execute_command，用户已适应 |
| readWsFile保护过严影响正常使用 | 🟢 LOW | 只保护敏感路径，正常文件不受影响 |
| CI/CD加固导致构建失败 | 🟡 MEDIUM | 先在测试分支验证，确认无误后合并 |

## Documentation Updates

需要更新的文档：

1. **README.md** - 更新架构图，说明三层通信机制
2. **AGENTS.md** - 更新工具列表，移除cli_anything
3. **docs/05-architecture/overview.md** - 补充bus和adapters模块说明
4. **docs/06-security/protected-paths.md** - 新增，说明文件保护机制
