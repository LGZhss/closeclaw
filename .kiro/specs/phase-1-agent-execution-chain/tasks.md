# Implementation Plan: Phase 1 Agent 执行链路打通

## Overview

本实施计划将 Phase 1 设计转化为可执行的编码任务。目标是建立从消息路由到 Agent 执行再到 LLM 调用的完整链路，替换 `src/index.ts` 中的 TODO 存根。

实施策略：
1. 先建立核心接口和类型定义
2. 实现 Adapter Registry 和 OpenAI Adapter 迁移
3. 实现 Agent Runner 层
4. 集成至主流程
5. 统一配置系统
6. 添加测试覆盖

## Tasks

- [ ] 1. 建立核心接口和类型定义
  - [ ] 1.1 创建 LLM Adapter 基础接口
    - 创建 `src/adapters/base.ts` 文件
    - 定义 `ChatParams` 接口（包含 systemInstruction, history, message, tools, preferredLevel）
    - 定义 `ChatResponse` 接口（包含 text 和可选的 functionCall）
    - 定义 `LLMAdapter` 抽象类，包含 `chat()` 方法
    - 删除 `src/adapters/base.js` 文件
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 1.2 创建 Agent Runner 接口
    - 创建 `src/agent/` 目录
    - 创建 `src/agent/runner.ts` 文件
    - 定义 `ExecutionContext` 接口（包含 groupFolder, prompt, channel, history）
    - 定义 `AgentRunner` 接口，包含 `execute()` 和 `close()` 方法
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. 实现 Adapter Registry
  - [ ] 2.1 创建 Adapter Registry 实现
    - 创建 `src/adapters/registry.ts` 文件
    - 定义 `AdapterFactory` 类型
    - 实现 `registerAdapter()` 函数
    - 实现 `getAdapter()` 函数
    - 实现 `getRegisteredAdapterNames()` 函数
    - 实现 `clearRegistry()` 函数（标记为 @internal）
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 2.2 编写 Adapter Registry 单元测试
    - 创建 `tests/adapter-registry.test.ts` 文件
    - 测试 registerAdapter() 注册成功
    - 测试 getAdapter() 返回正确实例
    - 测试 getAdapter() 对不存在的 adapter 返回 null
    - 测试 getRegisteredAdapterNames() 返回所有名称
    - 测试工厂函数每次返回新实例
    - _Requirements: 8.3_

- [ ] 3. 迁移 OpenAI Adapter 至 TypeScript
  - [ ] 3.1 创建 TypeScript 版本的 OpenAI Adapter
    - 创建 `src/adapters/openai.ts` 文件
    - 实现 `OpenAIAdapter` 类，继承 `LLMAdapter`
    - 实现构造函数，验证 API Key
    - 实现 `chat()` 方法，支持 pro/flash/lite 三个级别
    - 实现降级策略（pro → flash → lite）
    - 实现 `_convertHistory()` 私有方法
    - 实现 `_extractText()` 私有方法
    - 实现 `_convertTools()` 私有方法
    - 在模块加载时调用 `registerAdapter('openai', () => new OpenAIAdapter())`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 3.2 删除旧的 JavaScript 版本
    - 删除 `src/adapters/openai.js` 文件
    - 更新所有引用 `openai.js` 的 import 语句为 `openai.ts`
    - _Requirements: 5.7_

  - [ ]* 3.3 编写 OpenAI Adapter 单元测试
    - 创建 `tests/openai-adapter.test.ts` 文件
    - 测试构造函数验证 API Key
    - 测试 chat() 方法调用 OpenAI API（使用 mock）
    - 测试 pro、flash、lite 三个级别
    - 测试降级策略
    - 测试函数调用响应解析
    - 测试历史记录格式转换
    - 测试工具定义格式转换
    - _Requirements: 8.4_

- [ ] 4. 实现 Sandbox Runner
  - [ ] 4.1 创建 Sandbox Runner 实现
    - 创建 `src/agent/sandbox-runner.ts` 文件
    - 实现 `SandboxRunner` 类，实现 `AgentRunner` 接口
    - 实现构造函数，接受 `adapterName` 参数（默认 'openai'）
    - 实现 `execute()` 方法：
      - 通过 `getAdapter()` 获取 LLM Adapter
      - 处理 adapter 不可用的情况
      - 调用 `adapter.chat()` 并返回响应文本
      - 捕获异常并返回错误消息
    - 实现 `close()` 方法
    - 添加日志记录
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 4.2 编写 Sandbox Runner 单元测试
    - 创建 `tests/agent-runner.test.ts` 文件
    - 测试 SandboxRunner 构造函数
    - 测试 execute() 方法调用 AdapterRegistry（使用 mock）
    - 测试 execute() 方法调用 adapter.chat()（使用 mock）
    - 测试 execute() 方法处理 adapter 不可用的情况
    - 测试 close() 方法正常执行
    - _Requirements: 8.1, 8.2_

  - [ ]* 4.3 编写 Property 1 测试：SandboxRunner 响应传递
    - 创建 `tests/properties/sandbox-runner.property.test.ts` 文件
    - **Property 1: SandboxRunner 响应传递**
    - **Validates: Requirements 2.4**
    - 使用 fast-check 生成任意响应文本
    - 验证 SandboxRunner.execute() 返回 adapter.chat() 的 text 字段
    - 运行 100 次迭代

- [ ] 5. Checkpoint - 验证核心组件
  - 运行 `npm run typecheck` 确保无类型错误
  - 运行 `npm test` 确保所有测试通过
  - 如有问题，询问用户

- [ ] 6. 集成至主流程
  - [ ] 6.1 更新 processGroup() 函数
    - 在 `src/index.ts` 中导入 `SandboxRunner`
    - 在 `processGroup()` 函数中创建 `SandboxRunner` 实例
    - 构建 `ExecutionContext` 对象
    - 调用 `runner.execute(context)`
    - 通过 `channel.sendMessage()` 发送响应
    - 添加异常处理，发送错误消息至 Channel
    - 删除 TODO 注释
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 6.2 更新 executeScheduledTask() 函数
    - 在 `executeScheduledTask()` 函数中集成 `SandboxRunner`
    - 删除 TODO 注释
    - _Requirements: 6.6_

  - [ ]* 6.3 编写主流程集成测试
    - 创建 `tests/phase-1-integration.test.ts` 文件
    - 测试 processGroup() 创建 SandboxRunner
    - 测试 processGroup() 调用 runner.execute()
    - 测试 processGroup() 通过 Channel 发送响应
    - 测试 processGroup() 处理 execute() 异常
    - 测试 executeScheduledTask() 集成
    - 使用 mock Channel 和 SandboxRunner
    - _Requirements: 8.5_

  - [ ]* 6.4 编写 Property 2 测试：触发词识别的一致性
    - 创建 `tests/properties/trigger-detection.property.test.ts` 文件
    - **Property 2: 触发词识别的一致性**
    - **Validates: Requirements 9.1**
    - 使用 fast-check 生成任意前缀、触发词、后缀
    - 验证系统能一致识别触发词
    - 运行 100 次迭代

  - [ ]* 6.5 编写 Property 3 测试：LLM 响应端到端传递
    - 创建 `tests/properties/end-to-end.property.test.ts` 文件
    - **Property 3: LLM 响应端到端传递**
    - **Validates: Requirements 9.3**
    - 使用 fast-check 生成任意 LLM 响应
    - Mock 整个链路（Channel, Adapter）
    - 验证响应文本通过 Channel 传递且未被修改
    - 运行 100 次迭代

- [ ] 7. 统一配置系统
  - [ ] 7.1 迁移配置常量
    - 检查 `src/config/config.js` 中被使用的常量
    - 将这些常量迁移至 `src/config.ts`
    - 更新所有引用 `src/config/config.js` 的 import 语句为 `src/config.ts`
    - _Requirements: 7.2, 7.4_

  - [ ] 7.2 删除旧配置文件
    - 删除 `src/config/config.js` 文件
    - 验证 `src/config.ts` 成为唯一的配置文件
    - _Requirements: 7.1, 7.3_

  - [ ] 7.3 验证配置统一
    - 运行 `npm run typecheck` 确保无类型错误
    - 运行 `npm test` 确保所有测试通过
    - _Requirements: 7.5_

- [ ] 8. 端到端验收测试
  - [ ]* 8.1 编写端到端测试
    - 创建 `tests/e2e/phase-1-acceptance.test.ts` 文件
    - 测试用户发送触发词消息
    - 测试系统识别触发词
    - 测试系统构建 prompt 并调用 Agent Runner
    - 测试系统返回 LLM 响应
    - 测试响应通过 Channel 发送
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 8.2 手动验收测试
    - 启动系统
    - 发送包含触发词的消息
    - 验证收到 LLM 生成的真实响应（非占位符）
    - 验证响应内容符合预期
    - 如有问题，询问用户

- [ ] 9. Final Checkpoint - 完整验证
  - 运行 `npm run typecheck` 确保无类型错误
  - 运行 `npm test` 确保所有测试通过（包括属性测试）
  - 验证测试覆盖率 ≥ 70%
  - 验证核心模块覆盖率 ≥ 80%
  - 如有问题，询问用户

## Notes

- 任务标记 `*` 为可选任务，可跳过以加快 MVP 交付
- 每个任务都引用了具体的需求编号，便于追溯
- Checkpoint 任务确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界条件
- TypeScript 迁移确保类型安全
- 配置统一避免配置冲突
