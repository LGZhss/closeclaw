# P031整合摘要 - Governance Build Reconstruction & Hardening

> **创建时间**: 2026-04-01  
> **协作主体**: Kiro  
> **整合范围**: 6个P031提案 + 核心文件恢复 + TypeScript严格合规 + P033未完成事项

---

## 📊 整合概览

本规格整合了以下内容：

### 1. P031提案整合（6个变体）

| 提案文件 | 核心问题 | 严重程度 |
|---------|---------|---------|
| `proposal-031-cli-anything-bug-fix.md` | cli_anything参数丢失 | 🟡 HIGH |
| `proposal-031-cli-anything-combined-fix.md` | 参数丢失 + 白名单绕过 | 🔴 CRITICAL |
| `proposal-031-comprehensive-audit-fixes.md` | 8个问题综合修复 | 🔴 CRITICAL |
| `proposal-031-critical-cli-anything-bypass.md` | 白名单绕过漏洞 | 🔴 CRITICAL |
| `proposal-031-critical-vulnerability-fix.md` | readWsFile缺少保护 | 🔴 CRITICAL |
| `proposal-031-runtime-bug-fixes.md` | 5个运行时Bug | 🟡 HIGH |

### 2. 核心文件恢复（Governance Build规划）

| 缺失文件 | 用途 | 影响 |
|---------|------|------|
| `src/bus/grpc-client.ts` | Go内核IPC通信客户端 | 编译失败 |
| `src/adapters/registry.ts` | LLM适配器注册逻辑 | 编译失败 |

### 3. TypeScript严格合规（7个编译错误）

| 文件 | 错误类型 | 数量 |
|------|---------|------|
| `src/index.ts` | 模块未找到 + 未使用变量 + 隐式any | 4 |
| `src/sandbox/manager.ts` | 未使用变量 | 1 |
| `src/tools/tool-registry.ts` | 未使用变量 | 2 |

### 4. P033未完成事项（CI/CD加固）

| 事项 | 状态 | 优先级 |
|------|------|--------|
| 创建.snyk配置文件 | ⏳ 待完成 | P4 |
| SonarCloud Quality Gate等待 | ⏳ 待完成 | P4 |
| Snyk严重性阈值 | ⏳ 待完成 | P4 |
| Cosign绑定Release | ⏳ 待完成 | P4 |

---

## 🎯 问题分类与优先级

### P0 - 安全漏洞（CRITICAL）

**B2.1: cli_anything白名单绕过**
- **问题**: 可执行任意命令，读取/删除任何文件
- **攻击向量**: `/cli cat .env` → 泄露所有API密钥
- **修复方案**: 物理删除cli_anything工具（参考P030）

**B2.2: readWsFile缺少保护**
- **问题**: 可读取.env、.git等敏感文件
- **攻击向量**: `/read .env` → 泄露所有敏感凭据
- **修复方案**: 添加PROTECTED_PATHS检查（与writeWsFile一致）

### P1 - 编译阻塞（HIGH）

**B1.1-B1.2: 缺失核心模块**
- **问题**: src/bus/grpc-client.ts 和 src/adapters/registry.ts 不存在
- **影响**: TypeScript编译失败，系统无法运行
- **修复方案**: 基于P027架构规范，全新创建这两个模块

### P2 - 功能Bug（HIGH/MEDIUM）

**B2.3: cli_anything参数丢失**
- **问题**: 自然语言命令映射丢失用户输入的参数
- **影响**: `/cli create directory my-folder` 只执行 `mkdir`
- **修复方案**: 随B2.1删除工具而自动解决

**B3.1: 临时文件名不一致**
- **问题**: 清理逻辑查找 `temp_exec_`，但创建的是 `temp_`
- **影响**: 临时文件无法被正确清理，导致堆积
- **修复方案**: 统一文件名模式为 `temp_`

**B3.2: read_file参数解析**
- **问题**: 无法处理带空格的文件名
- **影响**: `/read file with spaces.txt` 解析失败
- **修复方案**: 为read_file添加特殊处理（类似write_file）

**B3.3: runGit重试失效**
- **问题**: Promise没有await，catch无法捕获错误
- **影响**: Git操作失败时不会自动重试
- **修复方案**: 在Promise前添加await

### P3 - 代码质量（LOW）

**B1.3-B1.4, B3.4-B3.6: TypeScript未使用变量**
- **问题**: 未使用的导入和变量声明
- **影响**: TypeScript严格模式编译失败
- **修复方案**: 移除未使用的导入，使用或标记未使用的变量

### P4 - CI/CD加固（LOW）

**B4.1-B4.4: P033未完成事项**
- **问题**: CI/CD治理加固未完成
- **影响**: 缺少安全扫描基线和质量门控
- **修复方案**: 创建配置文件，修改工作流

---

## 📋 实施计划

### 阶段1: 核心模块恢复（编译阻塞修复）
- ✅ 任务1-5: 创建bus/grpc-client.ts和adapters/registry.ts
- ✅ 修复src/index.ts的类型错误
- ✅ 验证编译通过

### 阶段2: 安全漏洞修复（CRITICAL优先级）
- ✅ 任务6-8: 物理删除cli_anything工具
- ✅ 任务9-11: 为readWsFile添加PROTECTED_PATHS检查
- ✅ 任务12: SKIP（cli_anything参数丢失随工具删除而解决）

### 阶段3: 运行时Bug修复（HIGH/MEDIUM优先级）
- ✅ 任务13-15: 修复临时文件名不一致
- ✅ 任务16-18: 为read_file添加参数解析
- ✅ 任务19-21: 修复runGit重试机制
- ✅ 任务22-24: 清理未使用的变量和导入

### 阶段4: CI/CD加固（P033未完成事项）
- ✅ 任务25: 创建.snyk配置文件
- ✅ 任务26: 更新sonarcloud.yml添加Quality Gate等待
- ✅ 任务27: 更新snyk.yml添加严重性阈值
- ✅ 任务28: 更新sigstore-cosign.yml改为Release触发

### 阶段5: 最终验证与文档更新
- ✅ 任务29: 完整验证（测试、编译、安全）
- ✅ 任务30: 更新文档（README、AGENTS、架构文档）
- ✅ 任务31: 用户最终审查

---

## 🎯 成功标准

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

---

## 📚 相关文档

### 规格文件
- `bugfix.md` - Bug需求文档（21个问题的详细分析）
- `design.md` - 设计文档（技术方案和架构决策）
- `tasks.md` - 实施计划（31个任务的详细步骤）

### 提案文件
- `votes/proposal-031-*.md` - 6个P031提案原文

### 架构文档
- `docs/07-roadmap/P027-summary.md` - P027三语言微内核架构
- `docs/05-architecture/overview.md` - 架构概览
- `RULES.md` - 协作规则

---

## 🚀 下一步行动

1. **开始实施**: 打开 `tasks.md` 文件，按阶段执行任务
2. **运行测试**: 每完成一个阶段，运行相应的测试验证
3. **提交代码**: 使用有意义的commit message，关联Bug编号
4. **更新文档**: 完成所有修复后，更新相关文档

---

## 📞 协作主体信息

- **创建者**: Kiro
- **协作主体ID**: 从 `.subjects.json` 中选择
- **当前会话目标**: 整合P031提案，完成Governance Build Reconstruction & Hardening

---

> **CloseClaw - 公平、透明、高效的多智能体协作** 🚀  
> **Governance Build Reconstruction & Hardening 规格已就绪！**
