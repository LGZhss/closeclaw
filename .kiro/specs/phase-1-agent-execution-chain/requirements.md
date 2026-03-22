# Requirements Document

## Introduction

本文档定义 Proposal-020 Phase 1 的需求：Agent 执行链路打通。目标是让消息触发词能够通过 LLM Adapter 执行 prompt 并返回响应，建立从消息路由到 Agent 执行再到模型调用的完整链路。

Phase 1 是在 Phase 0（关键 Bug 修复）完成后的第一个功能性增强阶段，将替换 `src/index.ts` 中的 TODO 存根，实现真正的 Agent 执行能力。

## Glossary

- **Agent_Runner**: 负责执行 Agent 任务的抽象接口，定义统一的执行契约
- **Sandbox_Runner**: Agent_Runner 的具体实现，通过 SandboxManager 隔离执行 LLM prompt
- **LLM_Adapter**: 大语言模型适配器接口，统一不同 LLM 提供商的调用方式
- **Adapter_Registry**: LLM_Adapter 的注册表，管理多个 adapter 实例的生命周期
- **Prompt**: 发送给 LLM 的输入文本，包含系统指令和对话历史
- **Execution_Context**: Agent 执行时的上下文信息，包含 group folder、channel、消息历史等
- **Config_Unification**: 统一配置系统，删除 `src/config/config.js`，将常量合并至 `src/config.ts`

## Requirements

### Requirement 1: Agent Runner 接口定义

**User Story:** 作为系统架构师，我希望定义统一的 Agent 执行接口，以便支持多种执行策略（Sandbox、容器、本地进程等）。

#### Acceptance Criteria

1. THE Agent_Runner SHALL 定义 `execute(context: ExecutionContext): Promise<string>` 方法
2. THE Execution_Context SHALL 包含 `groupFolder`、`prompt`、`channel` 字段
3. THE Agent_Runner SHALL 定义 `close(): Promise<void>` 方法用于资源清理
4. THE Agent_Runner 接口 SHALL 导出自 `src/agent/runner.ts`

### Requirement 2: Sandbox Runner 实现

**User Story:** 作为开发者，我希望通过 SandboxManager 隔离执行 LLM 调用，以便保证系统安全性和资源隔离。

#### Acceptance Criteria

1. THE Sandbox_Runner SHALL 实现 Agent_Runner 接口
2. WHEN `execute()` 被调用时，THE Sandbox_Runner SHALL 通过 Adapter_Registry 获取 LLM_Adapter
3. WHEN LLM_Adapter 可用时，THE Sandbox_Runner SHALL 调用 `adapter.chat()` 方法
4. WHEN `adapter.chat()` 返回结果时，THE Sandbox_Runner SHALL 返回响应文本
5. IF LLM_Adapter 不可用，THEN THE Sandbox_Runner SHALL 返回错误消息
6. THE Sandbox_Runner SHALL 导出自 `src/agent/sandbox-runner.ts`

### Requirement 3: LLM Adapter 接口类型化

**User Story:** 作为 TypeScript 开发者，我希望 LLM Adapter 有完整的类型定义，以便在编译时捕获接口错误。

#### Acceptance Criteria

1. THE LLM_Adapter 接口 SHALL 定义 `chat(params: ChatParams): Promise<ChatResponse>` 方法
2. THE ChatParams 类型 SHALL 包含 `systemInstruction`、`history`、`message`、`tools`、`preferredLevel` 字段
3. THE ChatResponse 类型 SHALL 包含 `text` 和可选的 `functionCall` 字段
4. THE LLM_Adapter 接口 SHALL 导出自 `src/adapters/base.ts`
5. THE `src/adapters/base.js` 文件 SHALL 被删除

### Requirement 4: Adapter Registry 实现

**User Story:** 作为系统集成者，我希望有统一的 Adapter 注册机制，以便动态管理多个 LLM 提供商。

#### Acceptance Criteria

1. THE Adapter_Registry SHALL 提供 `registerAdapter(name: string, factory: AdapterFactory)` 方法
2. THE Adapter_Registry SHALL 提供 `getAdapter(name: string): LLMAdapter | null` 方法
3. THE Adapter_Registry SHALL 提供 `getRegisteredAdapterNames(): string[]` 方法
4. THE Adapter_Registry 实现 SHALL 与 ChannelRegistry 保持同构设计
5. THE Adapter_Registry SHALL 导出自 `src/adapters/registry.ts`

### Requirement 5: OpenAI Adapter 迁移

**User Story:** 作为 OpenAI 用户，我希望 OpenAI Adapter 有完整的 TypeScript 类型支持，以便安全地调用 GPT 模型。

#### Acceptance Criteria

1. THE OpenAI_Adapter SHALL 从 `src/adapters/openai.js` 迁移至 `src/adapters/openai.ts`
2. THE OpenAI_Adapter SHALL 实现 LLM_Adapter 接口
3. THE OpenAI_Adapter SHALL 保持现有的 `chat()` 方法签名不变
4. THE OpenAI_Adapter SHALL 支持 `pro`、`flash`、`lite` 三个模型级别
5. WHEN API 调用失败时，THE OpenAI_Adapter SHALL 按 `pro → flash → lite` 顺序降级
6. THE OpenAI_Adapter SHALL 在模块加载时自动注册至 Adapter_Registry
7. THE `src/adapters/openai.js` 文件 SHALL 被删除

### Requirement 6: 集成 Agent Runner 至主流程

**User Story:** 作为最终用户，我希望发送触发词后能收到 LLM 的真实响应，而不是占位符消息。

#### Acceptance Criteria

1. WHEN `processGroup()` 被调用时，THE System SHALL 创建 Sandbox_Runner 实例
2. WHEN Sandbox_Runner 创建成功时，THE System SHALL 调用 `runner.execute(context)`
3. WHEN `runner.execute()` 返回响应时，THE System SHALL 通过 Channel 发送响应消息
4. IF `runner.execute()` 抛出异常，THEN THE System SHALL 发送错误消息至 Channel
5. THE `src/index.ts` 中的 `processGroup` TODO 注释 SHALL 被删除
6. THE `src/index.ts` 中的 `executeScheduledTask` TODO 注释 SHALL 被删除

### Requirement 7: 配置系统统一

**User Story:** 作为维护者，我希望只有一个配置文件，以便避免配置冲突和重复定义。

#### Acceptance Criteria

1. THE `src/config/config.js` 文件 SHALL 被删除
2. WHEN `src/config/config.js` 中有被使用的常量时，THE System SHALL 将其迁移至 `src/config.ts`
3. THE `src/config.ts` SHALL 成为唯一的配置文件
4. ALL 引用 `src/config/config.js` 的 import 语句 SHALL 被更新为 `src/config.ts`
5. WHEN 配置统一完成后，THE System SHALL 通过 `npm run typecheck` 验证无类型错误

### Requirement 8: 单元测试覆盖

**User Story:** 作为质量保证工程师，我希望关键组件有单元测试，以便验证功能正确性。

#### Acceptance Criteria

1. THE Agent_Runner 接口 SHALL 有对应的单元测试文件 `tests/agent-runner.test.ts`
2. THE Sandbox_Runner SHALL 有单元测试，使用 mock SandboxManager
3. THE Adapter_Registry SHALL 有单元测试，验证注册和查询功能
4. THE OpenAI_Adapter SHALL 有集成测试，需要 `OPENAI_API_KEY` 环境变量
5. WHEN 所有测试运行时，THE System SHALL 通过 `npm test` 验证无失败用例

### Requirement 9: 端到端验收测试

**User Story:** 作为产品经理，我希望能够端到端验证消息触发到 LLM 响应的完整流程。

#### Acceptance Criteria

1. WHEN 用户发送包含触发词的消息时，THE System SHALL 识别触发词
2. WHEN 触发词被识别时，THE System SHALL 构建 prompt 并调用 Agent_Runner
3. WHEN Agent_Runner 执行成功时，THE System SHALL 返回 LLM 生成的响应
4. WHEN 响应返回时，THE System SHALL 通过 Channel 发送消息至原始聊天
5. THE 端到端测试 SHALL 验证从消息接收到响应发送的完整链路

### Requirement 10: 错误处理与降级

**User Story:** 作为运维工程师，我希望系统在 LLM 调用失败时有明确的错误处理和降级策略。

#### Acceptance Criteria

1. IF Adapter_Registry 中无可用 adapter，THEN THE System SHALL 返回 "No LLM adapter available" 错误
2. IF LLM API 调用超时，THEN THE System SHALL 返回 "LLM request timeout" 错误
3. IF LLM API 返回 4xx 错误，THEN THE System SHALL 记录错误日志并返回用户友好的错误消息
4. IF LLM API 返回 5xx 错误，THEN THE System SHALL 尝试降级至下一个模型级别
5. WHEN 所有降级尝试失败时，THE System SHALL 返回 "All LLM models unavailable" 错误
