# 提案 P031: Governance Build Reconstruction & Hardening（整合版）

> **提案 ID**: P031  
> **提案级别**: 一级 (CRITICAL)  
> **发起者**: Kiro（整合自6个P031变体）  
> **状态**: ✅ 已通过（用户特批）  
> **通过日期**: 2026-04-01  
> **实施规格**: `.kiro/specs/governance-build-reconstruction/`

---

## 📋 1. 环境拓扑与进度点

- **当前基准**: P027 结项状态 (三语言微内核架构) + P030 安全审计加固完成
- **当前分支**: `governance/consolidated-bolt-fixes`
- **关联任务**: 核心文件恢复、安全漏洞修复、运行时Bug修复、CI/CD加固完成

---

## 🎯 2. 整合说明

本提案整合了以下6个P031变体提案的所有内容：

| 原提案文件 | 核心问题 | 严重程度 |
|-----------|---------|---------|
| `proposal-031-cli-anything-bug-fix.md` | cli_anything参数丢失 | 🟡 HIGH |
| `proposal-031-cli-anything-combined-fix.md` | 参数丢失 + 白名单绕过 | 🔴 CRITICAL |
| `proposal-031-comprehensive-audit-fixes.md` | 8个问题综合修复 | 🔴 CRITICAL |
| `proposal-031-critical-cli-anything-bypass.md` | 白名单绕过漏洞 | 🔴 CRITICAL |
| `proposal-031-critical-vulnerability-fix.md` | readWsFile缺少保护 | 🔴 CRITICAL |
| `proposal-031-runtime-bug-fixes.md` | 5个运行时Bug | 🟡 HIGH |

**整合后的提案包含21个问题的完整修复方案。**

---

## 🚨 3. 问题总结（共21个）

### 3.1 模块缺失类（编译阻塞）- 4个问题

**B1.1**: `src/bus/grpc-client.ts` 不存在，导致 TS2307 编译错误  
**B1.2**: `src/adapters/registry.ts` 不存在，导致 TS2307 编译错误  
**B1.3**: `src/index.ts` 导入 config 但未使用，导致 TS6133 错误  
**B1.4**: `src/index.ts` busClient.onMessage 回调参数隐式 any 类型，导致 TS7006 错误

**影响**: 系统无法通过 TypeScript 编译，完全无法运行

---

### 3.2 安全漏洞类（CRITICAL）- 3个问题

**B2.1: cli_anything 白名单绕过漏洞**
- **问题**: 白名单机制可被完全绕过，攻击者可执行任意命令
- **攻击向量**: `/cli cat .env` → 直接读取所有 API 密钥
- **影响**: 可导致完全系统接管，泄露所有敏感凭据

**B2.2: readWsFile 缺少 PROTECTED_PATHS 检查**
- **问题**: 可读取工作区内任何文件，包括 .env、.git 等敏感文件
- **攻击向量**: `/read .env` → 泄露所有 API 密钥
- **影响**: 与 writeWsFile 不一致，存在安全漏洞

**B2.3: cli_anything 参数丢失**
- **问题**: 自然语言命令映射会丢失用户输入的参数
- **影响**: `/cli create directory my-folder` 只执行 `mkdir` 而不是 `mkdir my-folder`
- **注**: 此问题随 B2.1 修复（删除工具）而自动解决

---

### 3.3 运行时Bug类（HIGH/MEDIUM）- 6个问题

**B3.1: process-executor.ts 临时文件名不一致**
- **问题**: 创建 `temp_${executionId}.js`，但清理时查找 `temp_exec_`
- **影响**: 临时文件无法被正确清理，导致堆积

**B3.2: _parseArgsToObject 只对 write_file 有特殊处理**
- **问题**: read_file 无法处理带空格的文件名
- **影响**: `/read file with spaces.txt` 解析失败

**B3.3: runGit 重试机制永远不会触发**
- **问题**: Promise 没有 await，catch 块无法捕获错误
- **影响**: Git 操作失败时不会自动重试

**B3.4**: `src/sandbox/manager.ts` safeStdout 声明但未使用，导致 TS6133 错误  
**B3.5**: `src/tools/tool-registry.ts` safeCmd 导入但未使用，导致 TS6133 错误  
**B3.6**: `src/tools/tool-registry.ts` list_dir 的 dirPath 参数声明但未使用，导致 TS6133 错误

---

### 3.4 CI/CD加固类（P033未完成）- 4个问题

**B4.1**: 缺少 `.snyk` 配置文件，无法使用 ignore 基线  
**B4.2**: `sonarcloud.yml` 缺少 `-Dsonar.qualitygate.wait=true` 参数  
**B4.3**: `snyk.yml` 缺少 `--severity-threshold=high` 参数  
**B4.4**: `sigstore-cosign.yml` 在每次 push 时触发，应改为 release 时触发

---

## 🛠️ 4. 修复方案

### 4.1 核心模块恢复

**创建 `src/bus/grpc-client.ts`**:
- 实现 GrpcKernelBusClient 类
- 支持 Named Pipe (Windows) 和 Unix Socket (Linux)
- 定义 BusMessage 接口（type, payload, traceId）
- 实现 connect(), onMessage(), send(), close() 方法

**创建 `src/adapters/registry.ts`**:
- 实现 LLMAdapterRegistry 类
- 定义 LLMAdapter 接口
- 实现 register(), get() 方法
- 注册默认适配器（OpenRouter, Anthropic 等）

**修复 TypeScript 类型错误**:
- 移除未使用的 config 导入
- 为 busClient.onMessage 回调添加显式类型

---

### 4.2 安全漏洞修复

**B2.1 修复方案**: 物理删除 cli_anything 工具
- 删除 `src/tools/cli-anything.ts` 文件
- 从 `tool-definitions.ts` 移除 cliAnythingTool 定义
- 从 `tool-registry.ts` 移除 cli_anything handler
- **理由**: 参考 P030 删除 execute_command 的做法，保持一致性

**B2.2 修复方案**: 为 readWsFile 添加 PROTECTED_PATHS 检查
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
  // ... 其余代码
}
```

---

### 4.3 运行时Bug修复

**B3.1**: 将清理逻辑中的 `temp_exec_` 改为 `temp_`  
**B3.2**: 为 read_file 添加特殊参数解析（类似 write_file）  
**B3.3**: 在 runGit 的 Promise 前添加 await  
**B3.4**: 实际使用 safeStdout 记录日志或移除变量  
**B3.5**: 移除未使用的 safeCmd 导入  
**B3.6**: 使用下划线前缀标记有意未使用的参数

---

### 4.4 CI/CD加固

**B4.1**: 创建 `.snyk` 配置文件，配置 ignore 基线  
**B4.2**: 在 `sonarcloud.yml` 添加 `-Dsonar.qualitygate.wait=true`  
**B4.3**: 在 `snyk.yml` 添加 `--severity-threshold=high`  
**B4.4**: 将 `sigstore-cosign.yml` 触发器改为 `release: types: [published]`

---

## 🔍 5. 影响范围与风险

### 5.1 受影响文件清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `src/bus/grpc-client.ts` | 新建 | Go内核IPC通信客户端 |
| `src/adapters/registry.ts` | 新建 | LLM适配器注册逻辑 |
| `src/index.ts` | 修改 | 修复类型错误，使用新模块 |
| `src/tools/cli-anything.ts` | 删除 | 移除不安全工具 |
| `src/tools/tool-definitions.ts` | 修改 | 移除cli_anything定义 |
| `src/tools/tool-registry.ts` | 修改 | 移除cli_anything handler，修复其他Bug |
| `src/utils/utils.ts` | 修改 | 为readWsFile添加保护，修复runGit |
| `src/sandbox/manager.ts` | 修改 | 修复未使用变量 |
| `src/sandbox/process-executor.ts` | 修改 | 修复临时文件名不一致 |
| `.snyk` | 新建 | Snyk配置文件 |
| `.github/workflows/sonarcloud.yml` | 修改 | 添加Quality Gate等待 |
| `.github/workflows/snyk.yml` | 修改 | 添加严重性阈值 |
| `.github/workflows/sigstore-cosign.yml` | 修改 | 改为Release触发 |

### 5.2 风险评估

| 风险项 | 严重程度 | 缓解措施 |
|--------|---------|---------|
| 新创建的模块与Go层不兼容 | 🟡 MEDIUM | 严格遵循P027接口规范，编写集成测试 |
| 删除cli_anything影响现有用户 | 🟢 LOW | P030已删除execute_command，用户已适应 |
| readWsFile保护过严影响正常使用 | 🟢 LOW | 只保护敏感路径，正常文件不受影响 |
| CI/CD加固导致构建失败 | 🟡 MEDIUM | 先在测试分支验证，确认无误后合并 |

---

## 🗳️ 6. 投票表

### 协作主体投票

| 协作主体 | 态度 | 理由与风险评估 |
|---------|------|---------------|
| Kiro | ✅ 赞同 | 整合者。本提案整合了6个P031变体的所有内容，系统化解决21个问题：4个编译阻塞、3个CRITICAL安全漏洞、6个运行时Bug、4个CI/CD加固未完成事项。修复方案经过充分设计，遵循P027架构规范和P030安全实践。 |

### 用户投票

| 用户 | 态度 | 备注 |
|------|------|------|
| LGZhss | ✅ 特批通过 | 用户明确批准整合提案并授权立即执行。所有6个P031变体的问题已整合到统一规格中。 |

**投票结果**: 
- 协作主体票数: +1
- 用户得分: +13.5 (27个协作主体 × 0.5)
- **综合总得分**: +14.5
- 法定人数 (一级需 ≥2): 已达标 ✅

---

## 📋 7. 实施状态

### 7.1 规格文件

已创建完整的 Bugfix 规格：
- **路径**: `.kiro/specs/governance-build-reconstruction/`
- **文件**:
  - `bugfix.md` - Bug需求文档（21个问题详细分析）
  - `design.md` - 设计文档（技术方案和架构决策）
  - `tasks.md` - 实施计划（31个任务，5个阶段）
  - `INTEGRATION_SUMMARY.md` - 整合摘要
  - `.config.kiro` - 规格配置

### 7.2 实施计划

**5个阶段，31个任务**:
1. **阶段1**: 核心模块恢复（任务1-5）
2. **阶段2**: 安全漏洞修复（任务6-12）
3. **阶段3**: 运行时Bug修复（任务13-24）
4. **阶段4**: CI/CD加固（任务25-28）
5. **阶段5**: 最终验证与文档更新（任务29-31）

### 7.3 成功标准

- ✅ `npm run typecheck` 零错误
- ✅ `npm run build` 成功生成 dist/
- ✅ `npm test` 所有测试通过
- ✅ cli_anything 工具完全移除
- ✅ readWsFile 无法读取 .env、.git 等敏感文件
- ✅ Snyk 和 SonarCloud 扫描无 CRITICAL 漏洞
- ✅ CI/CD 加固配置全部生效

---

## 🕒 8. 更新日志

- **2026-04-01** - 创建整合提案 P031
- **2026-04-01** - 整合6个P031变体提案的所有内容
- **2026-04-01** - 创建完整的 Bugfix 规格（21个问题，31个任务）
- **2026-04-01** - 用户特批通过，授权立即执行

---

## 📚 9. 相关文档

### 原始提案（已整合，可归档）
- `votes/proposal-031-cli-anything-bug-fix.md`
- `votes/proposal-031-cli-anything-combined-fix.md`
- `votes/proposal-031-comprehensive-audit-fixes.md`
- `votes/proposal-031-critical-cli-anything-bypass.md`
- `votes/proposal-031-critical-vulnerability-fix.md`
- `votes/proposal-031-runtime-bug-fixes.md`

### 实施规格
- `.kiro/specs/governance-build-reconstruction/bugfix.md`
- `.kiro/specs/governance-build-reconstruction/design.md`
- `.kiro/specs/governance-build-reconstruction/tasks.md`
- `.kiro/specs/governance-build-reconstruction/INTEGRATION_SUMMARY.md`

### 架构文档
- `docs/07-roadmap/P027-summary.md` - P027三语言微内核架构
- `RULES.md` - 协作规则
- `AGENTS.md` - 协作主体指南

---

> **CloseClaw - 公平、透明、高效的多智能体协作** 🚀  
> **P031 整合提案已通过，Governance Build Reconstruction & Hardening 开始实施！**
