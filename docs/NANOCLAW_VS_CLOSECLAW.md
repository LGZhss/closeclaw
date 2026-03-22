# NanoClaw vs CloseClaw 对比分析

> **分析日期**: 2026-03-22  
> **NanoClaw 路径**: `E:\nanoclaw`  
> **CloseClaw 路径**: `E:\.closeclaw`  
> **目的**: 分析 CloseClaw 在 NanoClaw 基础上的改进和扩展

---

## 📊 文件数量对比

| 项目 | TypeScript 文件 | 测试文件 | 总计 |
|------|----------------|---------|------|
| **NanoClaw** | 20 个 | 13 个 | 33 个 |
| **CloseClaw (TS)** | 19 个 | ~40 个 | ~60 个 |
| **CloseClaw (JS)** | 15 个 | 0 个 | 15 个 |
| **CloseClaw 总计** | 34 个代码文件 | ~40 个测试 | ~75 个 |

---

## 🔴 NanoClaw 独有（CloseClaw 删除/替换）

### 1. **Container 相关（已废弃）**
```
❌ container-runner.ts       - 容器运行器
❌ container-runtime.ts      - 容器运行时
❌ mount-security.ts         - 挂载安全
```

**原因**: CloseClaw 采用 Sandbox 架构替代容器方案
- 提案 020 Phase 0 清理了容器残留（C5）
- 新架构使用 `src/agent/sandbox-runner.ts` + `src/sandbox/`

### 2. **安全相关（已废弃）**
```
❌ credential-proxy.ts       - 凭证代理
❌ sender-allowlist.ts       - 发送者白名单
❌ remote-control.ts         - 远程控制
```

**原因**: CloseClaw 简化了安全模型
- 不再需要复杂的凭证代理
- 发送者验证逻辑简化
- 远程控制功能未实现

### 3. **辅助功能（已废弃）**
```
❌ env.ts                    - 环境变量管理
❌ timezone.ts               - 时区处理
❌ group-folder.ts           - 群组文件夹管理
```

**原因**: 功能合并或简化
- `env.ts` → 直接使用 `process.env`
- `timezone.ts` → 使用标准库
- `group-folder.ts` → 逻辑合并到 `index.ts`

---

## 🟢 CloseClaw 新增（NanoClaw 没有）

### 1. **Adapter 层（全新架构）**
```
✅ adapters/base.ts          - LLM Adapter 接口
✅ adapters/registry.ts      - Adapter 注册表
✅ adapters/openai.ts        - OpenAI Adapter (TS)
✅ adapters/subject-adapter.ts - 协作主体适配器
✅ adapters/mcp-bridge.ts    - MCP 桥接
```

**新增功能**:
- 统一的 LLM 调用接口
- 支持多个 LLM 提供商（OpenAI, Claude, Gemini, Local）
- 工厂模式注册机制
- 协作主体集成

### 2. **Agent 执行层（全新架构）**
```
✅ agent/runner.ts           - Agent Runner 接口
✅ agent/sandbox-runner.ts   - Sandbox Runner 实现
```

**新增功能**:
- 替代 NanoClaw 的容器方案
- 子进程隔离 + Worker Threads 降级
- 与 Sandbox 层集成

### 3. **Channel 扩展**
```
✅ channels/telegram.ts      - Telegram Channel 实现
```

**新增功能**:
- Telegram Bot 支持
- Long Polling 消息接收
- Markdown 格式化
- 消息分割（4096 字符限制）

### 4. **遗留 JS 模块（待迁移）**
```
🟡 adapters/claude.js        - Claude Adapter
🟡 adapters/gemini.js        - Gemini Adapter
🟡 adapters/local.js         - Local Model Adapter
🟡 sandbox/sandboxManager.js - 沙盒管理器
🟡 sandbox/processExecutor.js - 进程执行器
🟡 core/*.js (6 个文件)      - 核心模块（未使用）
🟡 tools/*.js (3 个文件)     - 工具模块
```

---

## 🔄 共有文件（可能有修改）

### 核心文件
```
= config.ts              - 配置管理
= db.ts                  - 数据库操作
= group-queue.ts         - 群组队列
= index.ts               - 主入口
= ipc.ts                 - IPC 通信
= logger.ts              - 日志系统
= router.ts              - 消息路由
= task-scheduler.ts      - 任务调度
= types.ts               - 类型定义
```

### Channel 相关
```
= channels/index.ts      - Channel 入口
= channels/registry.ts   - Channel 注册表
```

**主要修改**:
- `config.ts`: 删除容器配置，添加新配置项
- `db.ts`: 删除 `container_config` 字段，添加新表
- `group-queue.ts`: `activeContainers` → `activeAgents`
- `index.ts`: 集成 SandboxRunner，移除容器逻辑
- `ipc.ts`: 移除 chokidar 依赖
- `router.ts`: 添加 `getRouterState` 导入
- `types.ts`: 删除容器类型，添加新类型

---

## 📈 架构演进对比

### NanoClaw 架构
```
入口层 (index.ts)
    ↓
通道层 (channels/)
    ↓
路由层 (router.ts)
    ↓
容器运行层 (container-runner.ts)
    ↓
容器运行时 (container-runtime.ts)
    ↓
安全层 (credential-proxy, sender-allowlist)
    ↓
持久化层 (db.ts)
```

### CloseClaw 架构
```
入口层 (index.ts)
    ↓
通道层 (channels/)
    ├── Telegram (新增)
    └── Registry
    ↓
路由层 (router.ts)
    ↓
Agent 执行层 (agent/) ← 新增
    ├── Runner 接口
    └── Sandbox Runner
    ↓
模型适配层 (adapters/) ← 新增
    ├── OpenAI
    ├── Claude
    ├── Gemini
    └── Local
    ↓
沙盒层 (sandbox/) ← 新增
    ├── Sandbox Manager
    └── Process Executor
    ↓
IPC 层 (ipc.ts)
    ↓
调度层 (task-scheduler.ts)
    ↓
持久化层 (db.ts)
```

---

## 🎯 关键改进

### 1. **从容器到沙盒**
- ❌ 移除：Docker 容器依赖
- ✅ 新增：子进程 + Worker Threads 沙盒
- **优势**：更轻量，无需 Docker，跨平台兼容

### 2. **LLM 抽象层**
- ❌ NanoClaw：无 LLM 抽象
- ✅ CloseClaw：统一 Adapter 接口
- **优势**：支持多个 LLM 提供商，易于扩展

### 3. **Telegram 支持**
- ❌ NanoClaw：无 Telegram Channel
- ✅ CloseClaw：完整 Telegram Bot 实现
- **优势**：支持 Telegram 消息收发

### 4. **协作框架**
- ❌ NanoClaw：无协作功能
- ✅ CloseClaw：投票系统、提案流程
- **优势**：多主体协作开发

### 5. **测试覆盖**
- 🟡 NanoClaw：13 个测试文件
- ✅ CloseClaw：~40 个测试文件
- **优势**：更完整的测试覆盖

---

## 📊 代码量对比

### NanoClaw
```
src/                    ~20 个 TS 文件
tests/                  ~13 个测试文件
总代码行数              ~3000 行（估算）
```

### CloseClaw
```
src/                    ~34 个代码文件（19 TS + 15 JS）
tests/                  ~40 个测试文件
docs/                   ~20 个文档文件
votes/                  ~20 个提案文件
总代码行数              ~8000 行（估算）
```

**增长**: CloseClaw 代码量约为 NanoClaw 的 **2.5 倍**

---

## 🔧 技术栈对比

| 技术 | NanoClaw | CloseClaw |
|------|----------|-----------|
| **运行时** | Node.js + Docker | Node.js (纯) |
| **语言** | TypeScript | TypeScript + JavaScript (混用) |
| **数据库** | better-sqlite3 | better-sqlite3 |
| **日志** | pino | pino |
| **测试** | 内置测试 | Vitest |
| **LLM** | 无抽象 | 统一 Adapter 接口 |
| **Channel** | 抽象接口 | Telegram 实现 |
| **隔离** | Docker 容器 | 子进程 + Worker |
| **协作** | 无 | 投票系统 |

---

## 🎯 CloseClaw 的核心创新

### 1. **去容器化**
- 移除 Docker 依赖
- 使用轻量级沙盒方案
- 更好的跨平台兼容性

### 2. **LLM 生态**
- 支持多个 LLM 提供商
- 统一调用接口
- 降级链机制

### 3. **协作框架**
- 多主体投票系统
- 提案驱动开发
- 文档化决策过程

### 4. **Channel 扩展**
- Telegram Bot 完整实现
- 易于添加新 Channel

### 5. **类型安全**
- 核心模块 TypeScript 化
- 接口定义清晰
- IDE 支持更好

---

## ⚠️ 待完成工作

### 1. **JS → TS 迁移**
- 15 个 JS 文件待迁移
- 主要是 Adapter 和 Sandbox 层

### 2. **死代码清理**
- `src/core/` 6 个文件未使用
- `src/config/config.js` 重复配置

### 3. **文档完善**
- API 文档
- 架构图
- 开发指南

### 4. **测试增强**
- 集成测试
- 端到端测试
- 性能测试

---

## 📚 参考资料

- [NanoClaw 源代码](E:\nanoclaw)
- [CloseClaw 源代码](E:\.closeclaw)
- [提案 020 - 架构解耦蓝图](../votes/proposal-020-architecture-decouple-blueprint.md)
- [提案 021 - Phase 0-2 实施](../votes/proposal-021-phase-0-2-implementation.md)

---

## 🎯 结论

CloseClaw 在 NanoClaw 基础上进行了**重大架构升级**：

1. **去容器化** - 更轻量，更易部署
2. **LLM 抽象** - 支持多提供商，易扩展
3. **协作框架** - 多主体协作开发
4. **Channel 扩展** - Telegram 支持
5. **类型安全** - TypeScript 化核心模块

代码量增长 2.5 倍，但架构更清晰，功能更强大，可维护性更好。

**下一步**: 完成 Phase 3（JS → TS 迁移），实现完全类型化。
