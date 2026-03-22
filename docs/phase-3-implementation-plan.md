# Phase 3 实施计划：TS 全量迁移与模块化

> **状态**: 📝 规划中
> **开始日期**: 2026-03-22
> **预计完成**: TBD

---

## 📋 目标

根据提案 020，Phase 3 的目标是：
1. **消灭 JS/TS 混用** - 将所有 JS 文件迁移到 TypeScript
2. **模块化重构** - 拆分大文件，提高代码可维护性
3. **类型安全** - 为所有模块补全类型定义

---

## 📊 当前状态

### 已完成（Phase 0-2）
- ✅ `src/adapters/base.ts` - LLM Adapter 接口
- ✅ `src/adapters/openai.ts` - OpenAI Adapter
- ✅ `src/adapters/registry.ts` - Adapter Registry
- ✅ `src/agent/runner.ts` - Agent Runner 接口
- ✅ `src/agent/sandbox-runner.ts` - Sandbox Runner 实现
- ✅ `src/channels/telegram.ts` - Telegram Channel
- ✅ 关键 Bug 修复（B1, B2, B3, C5, C7）

### 待迁移的 JS 文件（15个）

#### 1. Adapters（3个）
- `src/adapters/claude.js` → `src/adapters/claude.ts`
- `src/adapters/gemini.js` → `src/adapters/gemini.ts`
- `src/adapters/local.js` → `src/adapters/local.ts`

#### 2. Sandbox（2个）
- `src/sandbox/sandboxManager.js` → `src/sandbox/sandboxManager.ts`
- `src/sandbox/processExecutor.js` → `src/sandbox/processExecutor.ts`

#### 3. Core（6个 - 待废弃）
- `src/core/agentRegistry.js`
- `src/core/arbitrator.js`
- `src/core/dispatcher.js`
- `src/core/session.js`
- `src/core/skillExecutor.js`
- `src/core/voter.js`

#### 4. Tools（3个）
- `src/tools/cliAnything.js` → `src/tools/cliAnything.ts`
- `src/tools/toolDefinitions.js` → `src/tools/toolDefinitions.ts`
- `src/tools/toolRegistry.js` → `src/tools/toolRegistry.ts`

#### 5. Config（1个）
- `src/config/config.js` - 待删除（已合并到 `src/config.ts`）

---

## 🎯 实施任务

### 任务 1: 迁移 Adapter 层（高优先级）

**文件**:
- `src/adapters/claude.js` → `src/adapters/claude.ts`
- `src/adapters/gemini.js` → `src/adapters/gemini.ts`
- `src/adapters/local.js` → `src/adapters/local.ts`

**要求**:
1. 实现 `LLMAdapter` 接口
2. 补全类型定义（ChatParams, ChatResponse）
3. 自动注册到 AdapterRegistry
4. 支持 pro/flash/lite 降级链（如适用）
5. 编写单元测试

**验收标准**:
- [ ] 所有 Adapter 实现 `LLMAdapter` 接口
- [ ] TypeScript 编译零错误
- [ ] 单元测试通过
- [ ] 可以通过 AdapterRegistry 获取

---

### 任务 2: 迁移 Sandbox 层（高优先级）

**文件**:
- `src/sandbox/sandboxManager.js` → `src/sandbox/sandboxManager.ts`
- `src/sandbox/processExecutor.js` → `src/sandbox/processExecutor.ts`

**要求**:
1. 定义 `ISandboxManager` 和 `IProcessExecutor` 接口
2. 补全类型定义
3. 与 `SandboxRunner` 集成
4. 编写单元测试

**验收标准**:
- [ ] 接口定义清晰
- [ ] TypeScript 编译零错误
- [ ] 单元测试通过
- [ ] 与 SandboxRunner 集成测试通过

---

### 任务 3: 废弃 Core 层（中优先级）

**文件**（6个）:
- `src/core/agentRegistry.js`
- `src/core/arbitrator.js`
- `src/core/dispatcher.js`
- `src/core/session.js`
- `src/core/skillExecutor.js`
- `src/core/voter.js`

**策略**:
1. **评估依赖** - 检查哪些文件还在使用 core 层
2. **迁移功能** - 将必要的功能迁移到新架构
3. **删除文件** - 删除所有 core 层文件
4. **更新导入** - 修复所有 import 引用

**验收标准**:
- [ ] 所有 core 层文件已删除
- [ ] 无 import 错误
- [ ] 所有测试通过

---

### 任务 4: 迁移 Tools 层（低优先级）

**文件**:
- `src/tools/cliAnything.js` → `src/tools/cliAnything.ts`
- `src/tools/toolDefinitions.js` → `src/tools/toolDefinitions.ts`
- `src/tools/toolRegistry.js` → `src/tools/toolRegistry.ts`

**要求**:
1. 定义 Tool 接口
2. 补全类型定义
3. 编写单元测试

**验收标准**:
- [ ] 所有 Tool 有类型定义
- [ ] TypeScript 编译零错误
- [ ] 单元测试通过

---

### 任务 5: 模块化 db.ts（低优先级）

**目标**: 将 `src/db.ts`（500+ 行）拆分为模块化结构

**建议结构**:
```
src/db/
├── index.ts           # 导出所有模块
├── connection.ts      # 数据库连接和初始化
├── messages.ts        # 消息相关操作
├── groups.ts          # 群组相关操作
├── tasks.ts           # 任务相关操作
├── sessions.ts        # 会话相关操作
└── router-state.ts    # 路由状态相关操作
```

**验收标准**:
- [ ] 文件拆分完成
- [ ] 所有导入更新
- [ ] 所有测试通过
- [ ] TypeScript 编译零错误

---

### 任务 6: 重命名 Scheduler（低优先级）

**目标**: 将 `src/task-scheduler.ts` 重构为模块化结构

**建议结构**:
```
src/scheduler/
├── index.ts           # 主入口
├── cron-parser.ts     # Cron 表达式解析
└── task-executor.ts   # 任务执行器
```

**验收标准**:
- [ ] 文件重构完成
- [ ] 所有导入更新
- [ ] 所有测试通过

---

## 📅 实施顺序

### 第一阶段（高优先级）
1. **迁移 Adapter 层** - Claude, Gemini, Local
2. **迁移 Sandbox 层** - SandboxManager, ProcessExecutor
3. **删除 config.js** - 已合并到 config.ts

### 第二阶段（中优先级）
4. **废弃 Core 层** - 评估依赖 → 迁移功能 → 删除文件

### 第三阶段（低优先级）
5. **迁移 Tools 层** - cliAnything, toolDefinitions, toolRegistry
6. **模块化 db.ts** - 拆分为多个模块
7. **重命名 Scheduler** - 重构为模块化结构

---

## 🧪 测试策略

### 单元测试
- 每个迁移的模块都需要单元测试
- 使用 vitest 编写测试
- Mock 外部依赖

### 集成测试
- Adapter 与 AdapterRegistry 集成
- Sandbox 与 SandboxRunner 集成
- 端到端测试：触发词 → LLM 响应

### 回归测试
- 运行所有现有测试
- 确保 Phase 0-2 的功能不受影响

---

## ⚠️ 风险与注意事项

### 风险
1. **依赖关系复杂** - Core 层可能被多处引用
2. **类型定义不完整** - 旧代码可能缺少类型信息
3. **测试覆盖不足** - 部分模块可能没有测试

### 缓解措施
1. **逐步迁移** - 一次迁移一个模块
2. **保持向后兼容** - 迁移过程中保持功能不变
3. **充分测试** - 每次迁移后运行完整测试套件

---

## 📊 进度跟踪

| 任务 | 状态 | 负责人 | 完成日期 |
|------|------|--------|----------|
| 迁移 Adapter 层 | 📝 待开始 | - | - |
| 迁移 Sandbox 层 | 📝 待开始 | - | - |
| 废弃 Core 层 | 📝 待开始 | - | - |
| 迁移 Tools 层 | 📝 待开始 | - | - |
| 模块化 db.ts | 📝 待开始 | - | - |
| 重命名 Scheduler | 📝 待开始 | - | - |

---

## 🎯 成功标准

Phase 3 完成的标准：
- [ ] 所有 JS 文件已迁移或删除
- [ ] TypeScript 编译零错误
- [ ] 所有测试通过（包括新增测试）
- [ ] 代码覆盖率 ≥ 80%
- [ ] 文档更新完成
- [ ] Phase 0-2 的功能正常运行

---

## 📚 参考资料

- [提案 020 - 架构解耦与分层重构蓝图](../votes/proposal-020-architecture-decouple-blueprint.md)
- [提案 021 - Phase 0-2 实施完成](../votes/proposal-021-phase-0-2-implementation.md)
- [Phase 1 实施总结](.kiro/specs/phase-1-agent-execution-chain/IMPLEMENTATION_SUMMARY.md)
- [Phase 2 实施总结](.kiro/specs/phase-2-telegram-channel/IMPLEMENTATION_SUMMARY.md)
