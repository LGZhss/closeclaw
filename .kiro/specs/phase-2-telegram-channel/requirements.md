# Requirements Document

## Introduction

本文档定义 Proposal-020 Phase 2 的需求：Telegram Channel 实现。目标是通过 Telegram Bot API 实现 Channel 接口，使系统能够通过 Telegram 收发消息，建立第一个生产可用的通信通道。

Phase 2 是在 Phase 1（Agent 执行链路打通）完成后的通道层扩展，将使 CloseClaw 能够通过 Telegram Bot 与用户交互，验证 Channel 接口的实用性和完整性。

## Glossary

- **Telegram_Channel**: Channel 接口的 Telegram 实现，负责与 Telegram Bot API 交互
- **Bot_Token**: Telegram Bot 的身份凭证，从环境变量 `TELEGRAM_BOT_TOKEN` 读取
- **Update**: Telegram API 返回的消息更新对象，包含消息内容、发送者信息等
- **Chat_ID**: Telegram 中唯一标识聊天会话的 ID（个人聊天或群组聊天）
- **Message_ID**: Telegram 中唯一标识单条消息的 ID
- **Long_Polling**: Telegram Bot API 的消息获取方式，通过 `getUpdates` 方法轮询新消息
- **Markdown_V2**: Telegram 支持的消息格式化语法，需要转义特殊字符
- **JID**: CloseClaw 内部的聊天标识符，格式为 `telegram:{chat_id}`

## Requirements

### Requirement 1: Telegram Channel 基础实现

**User Story:** 作为系统架构师，我希望实现 Telegram Channel，以便用户能够通过 Telegram Bot 与 CloseClaw 交互。

#### Acceptance Criteria

1. THE Telegram_Channel SHALL 实现 Channel 接口的所有方法
2. THE Telegram_Channel SHALL 从环境变量 `TELEGRAM_BOT_TOKEN` 读取 Bot_Token
3. IF Bot_Token 不存在，THEN THE Telegram_Channel 工厂函数 SHALL 返回 null
4. THE Telegram_Channel SHALL 设置 `name` 属性为 "telegram"
5. THE Telegram_Channel SHALL 导出自 `src/channels/telegram.ts`

### Requirement 2: Bot 连接与验证

**User Story:** 作为开发者，我希望 Bot 在启动时验证 Token 有效性，以便及早发现配置错误。

#### Acceptance Criteria

1. WHEN `connect()` 被调用时，THE Telegram_Channel SHALL 调用 `getMe` API 验证 Bot_Token
2. WHEN `getMe` 返回成功时，THE Telegram_Channel SHALL 记录 Bot 用户名和 ID
3. IF `getMe` 返回 401 错误，THEN THE Telegram_Channel SHALL 抛出 "Invalid bot token" 错误
4. IF `getMe` 返回网络错误，THEN THE Telegram_Channel SHALL 抛出 "Failed to connect to Telegram" 错误
5. WHEN 连接成功后，THE Telegram_Channel SHALL 将 `isConnected()` 返回值设为 true

### Requirement 3: 消息接收（Long Polling）

**User Story:** 作为最终用户，我希望发送给 Bot 的消息能被系统接收，以便触发 Agent 执行。

#### Acceptance Criteria

1. WHEN `connect()` 成功后，THE Telegram_Channel SHALL 启动 Long_Polling 循环
2. THE Telegram_Channel SHALL 调用 `getUpdates` API 获取新消息，超时时间为 30 秒
3. WHEN 收到新 Update 时，THE Telegram_Channel SHALL 提取消息文本、发送者信息、Chat_ID
4. WHEN 消息提取成功时，THE Telegram_Channel SHALL 调用 `onMessage` 回调函数
5. THE IncomingMessage SHALL 包含 `id`（Message_ID）、`channel`（"telegram"）、`chatJid`（`telegram:{chat_id}`）、`senderJid`、`senderName`、`text`、`timestamp`、`isGroup` 字段
6. WHEN Update 的 `offset` 更新时，THE Telegram_Channel SHALL 在下次 `getUpdates` 调用中使用新的 offset
7. IF `getUpdates` 返回错误，THEN THE Telegram_Channel SHALL 等待 5 秒后重试

### Requirement 4: 消息发送

**User Story:** 作为 Agent，我希望能够通过 Telegram Channel 发送响应消息，以便用户收到回复。

#### Acceptance Criteria

1. WHEN `sendMessage(jid, text)` 被调用时，THE Telegram_Channel SHALL 从 JID 中提取 Chat_ID
2. THE Telegram_Channel SHALL 调用 `sendMessage` API 发送消息至指定 Chat_ID
3. THE Telegram_Channel SHALL 使用 `parse_mode: "Markdown"` 格式化消息
4. IF 消息长度超过 4096 字符，THEN THE Telegram_Channel SHALL 分割消息为多条发送
5. IF `sendMessage` 返回 400 错误（格式错误），THEN THE Telegram_Channel SHALL 移除 Markdown 格式后重试
6. IF `sendMessage` 返回 403 错误（Bot 被封禁），THEN THE Telegram_Channel SHALL 记录错误日志
7. WHEN 消息发送成功时，THE Telegram_Channel SHALL 返回 Promise<void>

### Requirement 5: JID 所有权判断

**User Story:** 作为路由系统，我希望能够判断 JID 是否属于 Telegram Channel，以便正确路由消息。

#### Acceptance Criteria

1. WHEN `ownsJid(jid)` 被调用时，THE Telegram_Channel SHALL 检查 JID 是否以 "telegram:" 开头
2. IF JID 以 "telegram:" 开头，THEN THE Telegram_Channel SHALL 返回 true
3. IF JID 不以 "telegram:" 开头，THEN THE Telegram_Channel SHALL 返回 false

### Requirement 6: 群组与私聊识别

**User Story:** 作为系统，我希望能够区分群组消息和私聊消息，以便应用不同的处理逻辑。

#### Acceptance Criteria

1. WHEN 收到的 Update 的 `chat.type` 为 "group" 或 "supergroup" 时，THE Telegram_Channel SHALL 设置 `isGroup` 为 true
2. WHEN 收到的 Update 的 `chat.type` 为 "private" 时，THE Telegram_Channel SHALL 设置 `isGroup` 为 false
3. WHEN `isGroup` 为 true 时，THE Telegram_Channel SHALL 设置 `groupName` 为 `chat.title`
4. WHEN `isGroup` 为 false 时，THE Telegram_Channel SHALL 不设置 `groupName` 字段

### Requirement 7: 断开连接与资源清理

**User Story:** 作为系统管理员，我希望在系统关闭时能够优雅地断开 Telegram 连接，以便释放资源。

#### Acceptance Criteria

1. WHEN `disconnect()` 被调用时，THE Telegram_Channel SHALL 停止 Long_Polling 循环
2. WHEN Long_Polling 停止后，THE Telegram_Channel SHALL 将 `isConnected()` 返回值设为 false
3. THE Telegram_Channel SHALL 清理所有未完成的 API 请求
4. WHEN `disconnect()` 完成时，THE Telegram_Channel SHALL 返回 Promise<void>

### Requirement 8: Channel 注册

**User Story:** 作为系统集成者，我希望 Telegram Channel 能够自动注册至 ChannelRegistry，以便系统启动时自动加载。

#### Acceptance Criteria

1. THE `src/channels/telegram.ts` 模块 SHALL 在加载时调用 `registerChannel("telegram", telegramFactory)`
2. THE telegramFactory 函数 SHALL 接受 ChannelOpts 参数并返回 Telegram_Channel 实例或 null
3. THE `src/channels/index.ts` SHALL 添加 `import './telegram.js'` 语句
4. WHEN 系统启动时，THE Telegram_Channel SHALL 出现在 `getRegisteredChannelNames()` 返回值中

### Requirement 9: Markdown 格式化

**User Story:** 作为最终用户，我希望收到的消息支持基本的格式化（粗体、斜体、代码块），以便提高可读性。

#### Acceptance Criteria

1. THE Telegram_Channel SHALL 支持 Markdown 格式的消息发送
2. THE Telegram_Channel SHALL 正确处理代码块（\`\`\`）、行内代码（\`）、粗体（\*\*）、斜体（\_）
3. IF Markdown 解析失败，THEN THE Telegram_Channel SHALL 降级为纯文本发送
4. THE Telegram_Channel SHALL 不转义用户输入的特殊字符（由 LLM 输出决定格式）

### Requirement 10: 错误处理与重试

**User Story:** 作为运维工程师，我希望 Telegram Channel 在网络错误时能够自动重试，以便提高系统可靠性。

#### Acceptance Criteria

1. IF `getUpdates` 返回网络错误，THEN THE Telegram_Channel SHALL 等待 5 秒后重试
2. IF `sendMessage` 返回 429 错误（速率限制），THEN THE Telegram_Channel SHALL 等待 `retry_after` 秒后重试
3. IF `sendMessage` 返回 5xx 错误，THEN THE Telegram_Channel SHALL 最多重试 3 次
4. WHEN 重试次数耗尽时，THE Telegram_Channel SHALL 记录错误日志并抛出异常
5. THE Telegram_Channel SHALL 记录所有 API 错误至日志系统

### Requirement 11: 单元测试覆盖

**User Story:** 作为质量保证工程师，我希望 Telegram Channel 有单元测试，以便验证功能正确性。

#### Acceptance Criteria

1. THE Telegram_Channel SHALL 有对应的单元测试文件 `tests/telegram-channel.test.ts`
2. THE 单元测试 SHALL 使用 mock Telegram API 响应
3. THE 单元测试 SHALL 验证 `connect()`、`sendMessage()`、`ownsJid()`、`disconnect()` 方法
4. THE 单元测试 SHALL 验证消息接收和 `onMessage` 回调调用
5. THE 单元测试 SHALL 验证错误处理和重试逻辑

### Requirement 12: 集成测试

**User Story:** 作为开发者，我希望能够在本地环境测试 Telegram Bot，以便验证与真实 API 的集成。

#### Acceptance Criteria

1. THE 集成测试 SHALL 需要 `TELEGRAM_BOT_TOKEN` 环境变量
2. THE 集成测试 SHALL 验证 Bot 连接和 `getMe` 调用
3. THE 集成测试 SHALL 提供手动测试指南，说明如何向 Bot 发送消息并验证响应
4. THE 集成测试文档 SHALL 包含在 `tests/telegram-integration.md` 中
5. IF `TELEGRAM_BOT_TOKEN` 未设置，THEN THE 集成测试 SHALL 跳过并输出提示信息
