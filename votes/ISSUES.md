# CloseClaw 核心问题与 PR 看板

> **创建**: 2026-04-08 (v2.0)  
> **最后更新**: 2026-04-14 (v3.2 — 修复落地与PR处置更新)  
> **维护者**: 全体协作主体  
> **说明**: 本文件同时追踪**未修复的技术问题**和**所有开放 PR 的进展**

---

## 📊 总览

| 类别 | 数量 | 状态说明 |
|------|------|----------|
| 🔴 P0 严重 Bug | 0 | ISSUE-001 已关闭（误判） |
| 🟡 P1 高优先级（架构待实现） | 1 | ISSUE-002 gRPC 占位（P027 计划内） |
| 🟢 P2 中优先级 | 4 | ISSUE-012~015 类型安全/ESLint |
| 🟢 P3 低优先级 | 4 | ISSUE-016~019 清理/类型/验证 |
| 🛡️ Open PR — Sentinel 安全系列 | 7 | 修复已在本分支等价落地，建议统一关闭重复 PR |
| ⚡ Open PR — Bolt 性能系列 | 8 | 修复已在本分支等价落地，建议统一关闭重复 PR |
| 🔧 Open PR — 基础设施系列 | 2 | #77 含 CVE 修复，可直接合并 |

---

## 🔴 P0 — 极高优先级 (Critical)

> *当前无 P0 级未修复问题。*

~~### ISSUE-001: 本地 .env 文件包含真实敏感凭据~~

- **状态**: ✅ **已关闭（误判）** — `.env` 已由 `.gitignore` 第 13 行正确排除，从未进入版本控制（`git check-ignore -v .env` 核查确认）。本地开发环境保存真实凭据是标准做法，不构成安全缺陷。

---

## 🟡 P1 — 高优先级 (High)

### ISSUE-002: GrpcKernelBusClient — P027 架构预留占位实现（待开发）

- **位置**: `src/bus/grpc-client.ts` L66, L98, L125
- **严重程度**: 🟡 HIGH（架构待实现项，非 Bug）
- **状态**: ⏳ **P027 Phase 1 待实现** — 这是**已知的、有意为之的脚手架代码**
- **描述**: `connect()`, `send()`, `close()` 方法含 `// TODO`，是为 P027 三语言微内核接入 Go 内核预留的占位实现。**当前系统通过 TS 单体模式（L3 降级基线）正常运行**，消息路由、LLM 调用、Telegram Bot 均通过 `src/index.ts` 直接运行，不依赖 `GrpcKernelBusClient`。
- **行动项**: 按 P027 Phase 1 验收标准实现 Named Pipe gRPC RTT ≤ 2ms；集成 `@grpc/grpc-js`

---

## 🟢 P2 — 中优先级 (Medium)

### ISSUE-012: tool-registry 大量使用 any 类型

- **位置**: `src/tools/tool-registry.ts` — `ToolHandler` 类型（L10）及 `parseArgsToObject` 参数（L20）
- **严重程度**: 🟢 MEDIUM
- **状态**: 📈 **部分改善（PR 待合并）** — Open PR #87/86 已新增 `ToolArguments`、`ToolContext`、`ToolDefinition` 类型定义并收紧 handler 签名，但尚未合并到 main
- **描述**: 当前 `ToolHandler = (args: any, context: any) => Promise<any>`，TS 类型保护完全缺失
- **建议**: 合并 Bolt PR（#90 或 #91）+ cherry-pick #87 的 tool-registry 类型改进

### ISSUE-013: SandboxRunner gRPC client 使用 any 类型注入

- **位置**: `src/agent/sandbox-runner.ts` L9 (`private client: any`)
- **严重程度**: 🟢 MEDIUM
- **状态**: ⚠️ **未修复** — 核查确认，`client` 字段及构造函数参数均为 `any`
- **描述**: `SandboxRunner` 通过构造函数注入 gRPC client，类型为 `any`，IDE 无法对 `.Chat()` 等 RPC 方法进行联想和检查。该设计体现了 Phase 3B 的架构意图（动态注入 gRPC 桩），但缺少类型定义。
- **建议**: 从 `proto/` 文件生成 TypeScript 桩代码（`ts-proto`），或手动定义 `IChatClient` 接口

### ISSUE-014: ESLint 规则过于宽松

- **位置**: `eslint.config.mjs`
- **严重程度**: 🟢 MEDIUM
- **状态**: ⚠️ **未修复** — 虽然 tsconfig.json 启用了 TypeScript 严格模式，但 ESLint 层面未阻止显式 `any` 声明
- **描述**: 未启用 `@typescript-eslint/no-explicit-any` 等核心质量守门规则，导致类型系统漏洞在 CI 中无法被检出
- **建议**: 启用 `@typescript-eslint/no-explicit-any: 'error'` 规则

### ISSUE-015: 进程错误路径的临时文件清理逻辑脆弱

- **位置**: `src/sandbox/process-executor.ts` L209-L214
- **严重程度**: 🟢 MEDIUM
- **状态**: ✅ **已修复（2026-04-14，本分支）**
- **描述**: `_executeProcess` 现通过显式参数 `tempFilePath` 接收待清理临时文件路径，不再依赖 `args.find(...temp_)` 推断；清理逻辑已统一为 async/catch 并忽略 `ENOENT`
- **建议**: 后续可进一步评估 `execute()` 的 `finally` 与 `_executeProcess` 错误路径清理是否需要去重

---

## 🟢 P3 — 低优先级 (Low)

### ISSUE-016: process-executor 临时文件清理未正确 await

- **位置**: `src/sandbox/process-executor.ts` L217（`fsPromises.unlink().catch()` 未 await）
- **严重程度**: 🟢 LOW
- **状态**: ✅ **已修复（2026-04-14，本分支）** — 清理逻辑改为异步 `unlink` + `ENOENT` 忽略，不再依赖同步前置检查

### ISSUE-017: SandboxManager catch 块使用 any 类型

- **位置**: `src/sandbox/manager.ts` L94（`catch (error: any)`）— 原记录路径有误，正确路径为 `src/sandbox/manager.ts`
- **严重程度**: 🟢 LOW
- **状态**: ✅ **已修复（2026-04-14，本分支）** — 改为 `catch (error: unknown)` 并做 `Error` 收窄
- **描述**: `run()` 方法的 catch 块使用 `error: any` 失去类型保护（对比同文件中 `stop()` L248 已正确使用 `error: unknown` + instanceof 守卫）
- **建议**: 改为 `catch (error: unknown)`，用 `error instanceof Error` 收窄后访问 `.message`

### ISSUE-018: gRPC 任务对象缺少统一类型定义

- **位置**: `src/agent/sandbox-runner.ts`、`src/bus/grpc-client.ts` 等多处
- **严重程度**: 🟢 LOW
- **状态**: ⚠️ **设计待完善** — 与 ISSUE-002 和 ISSUE-013 高度相关，根本解决方案是从 `proto/messages.proto` 生成 TS 桩代码
- **建议**: 使用 `ts-proto` 或 `grpc-tools` 从 `.proto` 文件自动生成类型定义

### ISSUE-019: 缺少启动时环境变量验证

- **位置**: `src/config.ts`
- **严重程度**: 🟢 LOW
- **状态**: ✅ **已修复（2026-04-14，本分支）** — `config.ts` 已引入 `zod` 做启动期解析
- **描述**: 当前 TypeScript 层直接使用的关键环境变量（`ASSISTANT_NAME`、`MAX_CONCURRENT_CONTAINERS`）已通过 `z.object({...}).parse(process.env)` 做强校验并提供默认值
- **建议**: 若后续在 TS 层直接读取更多 env（如 `TELEGRAM_TOKEN`），应一并纳入同一 schema

---

## 🏷️ GitHub Open PR 全量记录（17 个）

> **说明**: 所有 PR 均由 Jules (Google AI) 自动生成，已去除 CodeRabbit、DeepSource、Qodana 等机器人噪音，仅保留核心内容并翻译为中文。

---

### 🛡️ Sentinel 安全系列 — resolveSafePath 路径遍历漏洞

> **根因**: `resolveSafePath` 使用 `.startsWith()` 进行路径边界检查，存在两个漏洞：
> 1. **前缀穿越**: 允许访问同前缀的兄弟目录（如 `/workspace/proj` → `/workspace/proj-secrets`）
> 2. **黑名单绕过**: 黑名单规则作用于未解析的原始路径，可通过 `src/../../.env` 绕过

> **统一修复方案**: 改用 `path.relative(absoluteBase, targetPath)` 计算真实相对路径，验证结果不以 `..` 开头且非绝对路径；黑名单检查改作用于已规范化的相对路径。

| PR | 日期 | 推荐 | 特别说明 |
|----|------|------|---------| 
| **#92** | 2026-04-13 | 建议关闭（已等价落地） | 路径遍历核心修复已在本分支实现 |
| #89 | 2026-04-12 | 关闭（重复） | SonarQube ✅，包含 CI 工作流 Node24 配置 |
| #88 | 2026-04-11 | 关闭（重复） | 额外添加 `.jules/sentinel.md` 漏洞记录 |
| #85 | 2026-04-10 | 关闭（重复） | SonarQube ✅，精简版修复 |
| #83 | 2026-04-09 | 关闭（重复） | SonarQube ✅，含 Go 测试覆盖率 |
| #82 | 2026-04-08 | 关闭（重复） | 在 `tests/utils.test.ts` 新增专项测试 |
| #78 | 2026-04-06 | 关闭（重复） | 最早版本，`path.sep` 方案不如后续完善 |

---

#### PR #92 — 🛡️ Sentinel: [CRITICAL] 修复 resolveSafePath 中的路径遍历漏洞（最新版 ⭐）

- **链接**: https://github.com/LGZhss/closeclaw/pull/92
- **作者**: @LGZhss (by Jules)
- **创建**: 2026-04-13
- **状态**: Open · 已由本分支等价实现（建议关闭）

**漏洞描述**:
- `resolveSafePath` 使用 `.startsWith()` 进行边界检查，允许访问前缀相同的兄弟目录（如 `/workspace/project` → `/workspace/project-secrets`）
- 黑名单检查作用于未解析的原始输入，允许通过 `src/../../project/.env` 等路径绕过

**影响范围**:
- Agent 可对工作区外前缀相同的目录进行任意文件读写
- 可绕过 `.env` 等受保护文件的访问限制

**修复方案**:
- 计算 `path.relative(absoluteBase, targetPath)`，验证结果不以 `..` 开头且非绝对路径
- 黑名单规则改为作用于规范化后的相对路径而非原始输入

**验证方式**: 运行 `npm test`，确认现有路径正常解析，路径穿越攻击被成功阻断

---

#### PR #89 — 🛡️ Sentinel: [CRITICAL] 修复路径遍历与黑名单绕过

- **链接**: https://github.com/LGZhss/closeclaw/pull/89
- **作者**: @LGZhss (by Jules)
- **创建**: 2026-04-12
- **状态**: Open · 重复 PR（建议关闭）
- **SonarQube**: ✅ Quality Gate 通过，新代码覆盖率 100%

**与 #92 的差异**: 包含更多 CI 工作流修改（`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`、Semgrep SARIF 上传更新、SonarCloud Go 覆盖率路径调整）；添加了 `votes/proposal-033-path-traversal-fix.md` 治理文档

---

#### PR #88 — 🛡️ Sentinel: [CRITICAL] 修复 resolveSafePath 路径穿越

- **链接**: https://github.com/LGZhss/closeclaw/pull/88
- **作者**: @LGZhss (by Jules)
- **创建**: 2026-04-11
- **状态**: Open · 重复 PR（建议关闭）

**与 #92 的差异**: 额外在 `.jules/sentinel.md` 中添加漏洞记录条目

---

#### PR #85 — 🛡️ Sentinel: [CRITICAL] 修复 resolveSafePath 中的路径遍历

- **链接**: https://github.com/LGZhss/closeclaw/pull/85
- **作者**: @LGZhss (by Jules)
- **创建**: 2026-04-10
- **状态**: Open · 重复 PR（建议关闭）
- **SonarQube**: ✅ Quality Gate 通过

---

#### PR #83 — 🛡️ Sentinel: [CRITICAL] 修复文件系统工具中的路径遍历与黑名单绕过

- **链接**: https://github.com/LGZhss/closeclaw/pull/83
- **作者**: @LGZhss (by Jules)
- **创建**: 2026-04-09
- **状态**: Open · 重复 PR（建议关闭）
- **SonarQube**: ✅ Quality Gate 通过
- **特点**: 包含 Go 测试覆盖率报告文件

---

#### PR #82 — 🛡️ Sentinel: [CRITICAL] 修复 resolveSafePath 中的路径遍历绕过

- **链接**: https://github.com/LGZhss/closeclaw/pull/82
- **作者**: @LGZhss (by Jules)
- **创建**: 2026-04-08
- **状态**: Open · 重复 PR（建议关闭）
- **特点**: 在 `tests/utils.test.ts` 中新增了前缀匹配绕过的专项测试用例

---

#### PR #78 — 🛡️ Sentinel: [CRITICAL] 修复路径遍历与目录保护绕过

- **链接**: https://github.com/LGZhss/closeclaw/pull/78
- **作者**: @LGZhss (by Jules)
- **创建**: 2026-04-06
- **状态**: Open · 重复 PR（建议关闭，方案不如后续版本）
- **说明**: 使用 `path.sep` 检查子目录边界，加 `path.relative` 做黑名单匹配；设计不如后续纯 `path.relative` 方案精简

---

### ⚡ Bolt 性能系列 — 移除 fs.existsSync 阻塞调用

> **根因**: `fs.existsSync()` 是同步操作，会短暂阻塞 Node.js 主线程事件循环。在高并发沙箱执行路径中，同步磁盘检查会降低整体吞吐量。

> **统一修复方案**:
> - `ensureDirAsync()`: 直接调用 `fsPromises.mkdir({ recursive: true })`，捕获 `EEXIST` 错误
> - `readWsFileAsync()`: 改用 try/catch，仅在 `ENOENT` 时抛出自定义错误
> - `ProcessExecutor` 清理逻辑: 直接调用 `fsPromises.unlink()`，静默忽略 `ENOENT`

| PR | 日期 | 推荐 | 特别说明 |
|----|------|------|---------| 
| **#90** | 2026-04-12 | 建议关闭（已等价落地） | 核心性能修复与测试调整已在本分支实现 |
| **#91** | 2026-04-13 | 建议关闭（重复） | 与 #90 同类目标，已被本分支覆盖 |
| #87 | 2026-04-11 | 关闭（重复） | SonarQube ❌，额外含 tool-registry 类型改进（值得 cherry-pick） |
| #86 | 2026-04-10 | 关闭（重复） | 同时修了测试，格式化 tool-registry |
| #84 | 2026-04-09 | 关闭（重复） | SonarQube ❌ |
| #81 | 2026-04-08 | 关闭（重复） | 描述最详尽 |
| #80 | 2026-04-07 | 关闭（重复） | 标准版，含 CI 工作流调整 |
| #79 | 2026-04-06 | 关闭（重复） | 范围最小，仅修 ProcessExecutor 清理 |

---

#### PR #91 — ⚡ Bolt: 从异步路径中移除同步 fs.existsSync

- **链接**: https://github.com/LGZhss/closeclaw/pull/91
- **作者**: @LGZhss (by Jules)
- **创建**: 2026-04-13
- **状态**: Open · 重复 PR（建议关闭）

**做了什么**: 移除了 `src/utils/utils.ts` 和 `src/sandbox/process-executor.ts` 中 `fsPromises.mkdir`、`fsPromises.readFile`、`fsPromises.unlink` 操作之前的 `fs.existsSync` 阻塞检查

**为什么**: `fs.existsSync` 阻塞 Node.js 主线程事件循环，在高并发沙箱环境中降低吞吐量

**验证**: `npm test` 无回归

---

#### PR #90 — ⚡ Bolt: 移除阻塞性 fs.existsSync 操作（推荐 ⭐）

- **链接**: https://github.com/LGZhss/closeclaw/pull/90
- **作者**: @LGZhss (by Jules)
- **创建**: 2026-04-12
- **状态**: Open · 已由本分支等价实现（建议关闭）

**做了什么**:
- 同 #91 核心修复
- 额外修复了 `tests/root-directory-cleanup.test.ts` 中错误假设本地开发目录存在的测试断言
- 添加了 `.jules/bolt.md` 操作记录

---

#### PR #87 — ⚡ Bolt: 移除同步 fs.existsSync() 调用以解除事件循环阻塞

- **链接**: https://github.com/LGZhss/closeclaw/pull/87
- **作者**: @LGZhss (by Jules)
- **创建**: 2026-04-11
- **状态**: Open · 重复 PR（建议关闭）
- **SonarQube**: ❌ Quality Gate 失败（新代码覆盖率 0%）

**额外内容（有价值）**: 改善了 `src/tools/tool-registry.ts` 的类型安全，新增了 `ToolArguments`、`ToolContext`、`ToolDefinition` 类型定义（解决 ISSUE-012 部分内容）——**建议 cherry-pick 到 #90**

---

#### PR #86 — ⚡ Bolt: 移除同步 I/O 预检查以解除事件循环阻塞

- **链接**: https://github.com/LGZhss/closeclaw/pull/86
- **创建**: 2026-04-10 · 重复 PR（建议关闭）

---

#### PR #84 — ⚡ Bolt: 移除异步文件操作前的同步 fs 检查

- **链接**: https://github.com/LGZhss/closeclaw/pull/84
- **创建**: 2026-04-09 · 重复 PR（建议关闭）
- **SonarQube**: ❌ Quality Gate 失败

---

#### PR #81 — ⚡ Bolt: 用异步正确错误处理替换同步 fs.existsSync

- **链接**: https://github.com/LGZhss/closeclaw/pull/81
- **创建**: 2026-04-08 · 重复 PR（建议关闭）
- **价值**: 描述最详尽，可参考其说明完善合并 commit 信息

---

#### PR #80 — ⚡ Bolt: 移除同步 fs.existsSync 检查

- **链接**: https://github.com/LGZhss/closeclaw/pull/80
- **创建**: 2026-04-07 · 重复 PR（建议关闭）

---

#### PR #79 — ⚡ Bolt: 优化沙箱执行器中的临时文件清理

- **链接**: https://github.com/LGZhss/closeclaw/pull/79
- **创建**: 2026-04-06 · 重复 PR（建议关闭）
- **说明**: 最小化修复，仅修了 `ProcessExecutor` 一处，非完整修复

---

### 🔧 基础设施系列

---

#### PR #77 — chore(deps): 升级 npm_and_yarn 组中 3 个依赖（Dependabot）

- **链接**: https://github.com/LGZhss/closeclaw/pull/77
- **作者**: Dependabot（自动）
- **创建**: 2026-04-06
- **状态**: Open · 已在本分支纳入等价依赖升级（合并后可关闭）

**升级内容**:

| 包 | 旧版本 | 新版本 | 重要性 |
|---|--------|--------|--------|
| `yaml` | 2.8.2 | 2.8.3 | 修复多行流格式化栈溢出 |
| `picomatch` | 4.0.3 | 4.0.4 | 🔴 **安全修复** CVE-2026-33671、CVE-2026-33672 |
| `vite` | 8.0.0 | 8.0.5 | 🔴 **安全修复** 路径遍历绕过 + 多项 Bug 修复 |

> [!IMPORTANT]
> `picomatch` 和 `vite` 均有 CVE 安全漏洞修复，**建议优先合并**。

---

#### PR #65 — 综合治理加固与性能优化（P031 + Bolt 修复）

- **链接**: https://github.com/LGZhss/closeclaw/pull/65
- **作者**: @LGZhss
- **创建**: 2026-03-31
- **状态**: Open · 被后续修复覆盖（建议关闭）

**包含内容**:

1. **P031 安全修复**:
   - 删除 `src/tools/cli-anything.ts`（修复命令注入漏洞）
   - 在 `src/utils/utils.ts` 中添加 `resolveSafePath`（目录遍历保护的原始版本，后续 Sentinel PRs 是对其 Bug 的修复）
   - 在 `src/index.ts` 中锁定 IPC 为 Named Pipe/Unix Socket

2. **Bolt 性能优化**:
   - `ProcessExecutor` 和 `utils` 异步 IO 改造
   - 临时文件清理优化

**背景**: 所有后续 Sentinel PR（#78~#92）均来自对此 PR 中 `resolveSafePath` 初始实现 Bug 的反复修复。本分支已直接吸收关键修复，#65 当前建议关闭并避免重复合并。

---

## 🗺️ 推荐合并顺序

```
Phase 1 (本次已完成):
  在本分支等价落地 #77 + #90 + #92 的核心修复

Phase 2 (立即执行):
  关闭重复 PR #92, #91, #90, #89, #88, #87, #86, #85, #84, #83, #82, #81, #80, #79
  关闭被覆盖 PR #65
  关闭 #77（依赖升级已并入本分支）

Phase 3 (后续遗留):
  ISSUE-002: 实现真实 gRPC Named Pipe 通信（P027 核心）
  ISSUE-013: 定义 IChatClient 接口
  ISSUE-012/014: 持续收紧 tool-registry 与 ESLint 类型规则
```

---

## 🕒 更新日志

| 日期 | 版本 | 操作 | 说明 |
|------|------|------|------|
| 2026-04-14 | v3.2 | 修复落地 | 已在本分支等价落地 #77/#90/#92 核心改动，更新 ISSUE-015/016/017/019 状态与 PR 处置建议 |
| 2026-04-14 | v3.1 | 误判修正 | 核查代码后修正 ISSUE-001（已关闭）、ISSUE-002（重分类）、ISSUE-013/015/017 路径与描述 |
| 2026-04-14 | v3.0 | 全量 PR 追踪 | 抓取所有 17 个 Open PR，去噪翻译，制定合并规划 |
| 2026-04-08 | v2.0 | 精简重构 | 移除已修复问题，创建精简版本 |
| 2026-04-07 | v1.0 | 初始化 | 基于安全策略发现首批重大问题 |

---

## 📚 相关文档

- **P027 三语言架构**: `docs/07-roadmap/P027-summary.md`
- **治理规则**: `RULES.md`
- **模块说明**: `AGENTS.md`

---

> **CloseClaw - 透明驱动的高效协作** 🚀
