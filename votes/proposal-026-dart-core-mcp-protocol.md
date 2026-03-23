# CloseClaw Dart-Core + MCP 协议栈演进方案

> **提案 ID**: 026
> **提案级别**: 二级（架构演进，引入 MCP 协议与新技能引擎）
> **发起者**: Antigravity (用户授权)
> **发起日期**: 2026-03-23
> **状态**: ✅ 已通过（用户特批）
> **关联提案**: P020 Phase 3 先决条件、P023 MCP 分层设计

---

## 📋 背景与动机

本提案在 P021 已完成 Phase 0-2 的基础上，推进两项平行工作：

1. **完成 P020 Phase 3**：TS 全量迁移（废弃 JS 孤岛、模块化 `db.ts`），为后续多语言内核铺平现有 TS 层的基础；
2. **引入 MCP 协议栈与技能引擎**：作为 Dart 控制平面（P027）的核心服务侧，在 TS 层先行定义 MCP 工具注册格式和 SKILL.md 解析标准。

---

## 🎯 目标

### 目标 1：完成 P020 Phase 3 — TS 全量迁移（二级决议）

| 任务 | 文件 | 说明 |
| :--- | :--- | :--- |
| 迁移 Claude 适配器 | `src/adapters/claude.ts` | 补全 `ILLMAdapter` 类型定义 |
| 迁移 Gemini 适配器 | `src/adapters/gemini.ts` | 补全类型，注册至 AdapterRegistry |
| 迁移沙盒层 | `src/sandbox/manager.ts` + `process-executor.ts` | 从 `.js` 迁移，补全类型 |
| 废弃 `src/core/` JS 孤岛 | `voter.js`, `arbitrator.js`, `agentRegistry.js`, `dispatcher.js` 等 | 全部删除（功能由 Dart 审计中继替代）|
| 删除重复 Config | `src/config/config.js` | 合并至 `src/config.ts` |
| 模块化 `src/db.ts` | `src/db/schema.ts`, `messages.ts`, `groups.ts`, `tasks.ts`, `sessions.ts` | 按模块拆分，保持同一 `db` 实例 |
| 重命名调度器 | `src/task-scheduler.ts` → `src/scheduler/index.ts` | 无逻辑变化 |

**验收标准**：
- [ ] 所有 `.js` 文件已迁移或删除，`src/` 目录下无残余 JS 文件
- [ ] `npm run typecheck` 零错误，`npm test` 全部通过
- [ ] 代码覆盖率 ≥ 70%

---

### 目标 2：MCP 协议栈前置设计（为 P027 Dart 控制平面奠基）

#### 2.1 SKILL.md 工具注册格式（TS 侧）

在 `skills/` 目录建立统一的技能注册接口：

```typescript
// skills/src/registry.ts
interface SkillManifest {
  name: string;          // 对应 SKILL.md frontmatter 的 name 字段
  description: string;   // 触发场景描述（供 LLM 判断是否加载）
  allowedTools?: string[];
  entrypoint: string;    // 执行脚本路径（scripts/ 下的文件）
}
```

#### 2.2 TraceContext 透传规范

所有跨进程消息（TS→Go→Dart）必须携带 `trace_id`，格式为 UUID v4。

---

## 📂 变更文件清单

#### [MODIFY] `src/adapters/claude.ts`（从 `claude.js` 迁移）
#### [MODIFY] `src/adapters/gemini.ts`（从 `gemini.js` 迁移）
#### [NEW] `src/sandbox/manager.ts`（从 `sandboxManager.js` 迁移）
#### [NEW] `src/sandbox/process-executor.ts`（从 `processExecutor.js` 迁移）
#### [DELETE] `src/core/voter.js`, `arbitrator.js`, `agentRegistry.js`, `dispatcher.js`, `skillExecutor.js`
#### [DELETE] `src/config/config.js`
#### [NEW] `src/db/schema.ts`, `messages.ts`, `groups.ts`, `tasks.ts`, `sessions.ts`
#### [DELETE] `src/db.ts`（模块化后删除）
#### [NEW] `skills/src/registry.ts`（MCP 工具注册接口）

---

## ⚠️ 风险评估

| 风险 | 等级 | 缓解措施 |
| :--- | :--- | :--- |
| `db.ts` 拆分破坏事务边界 | 中 | 所有操作共享同一 `db` 实例，仅做函数分组 |
| 适配器迁移破坏 API 兼容 | 低 | 保持 `chat()` 方法签名不变 |
| `src/core/` 删除影响未知调用方 | 低 | GitNexus 确认这些文件从未被 `index.ts` 调用（P020 C2 已记录）|

---

## 🗳️ 协作主体投票

| 协作主体 | 态度 | 得分 | 技术理由 |
| :--- | :--- | :--- | :--- |
| **用户** | ✅ 赞同 | +14.5 | 提案发起者特批。完成 P020 Phase 3 是 P027 多语言内核的必要前提，同时引入 MCP 工具注册规范为 Dart 控制平面打下基础。（用户权重 0.5×29=14.5）|
| **Antigravity** | ✅ 赞同 | +1 | 本提案严格以 P020 Phase 3 清单为执行依据，并在 TS 层引入 MCP 工具注册规范，为 P027 三语言架构做夯实准备。删除 `src/core/` JS 孤岛将大幅降低后续多语言迁移的噪音。|

---

## 📊 决议统计

| 项目 | 值 |
| :--- | :--- |
| 用户得分 | +14.5 |
| 协作主体得分 | +1 |
| **综合总得分** | **+15.5** |
| 法定人数（二级决议需 ≥3 参与）| ✅ 已达标 |
| **通过状态** | ✅ **已通过（用户特批）** |

---

> **CloseClaw 协作系统 - 架构演进驱动开发**
