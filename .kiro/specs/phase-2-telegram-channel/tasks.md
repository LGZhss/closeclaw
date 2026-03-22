# Tasks: Phase 2 Telegram Channel

## 1. 核心实现

### 1.1 创建 Telegram Channel 类
- [ ] 1.1.1 创建 `src/channels/telegram.ts` 文件
- [ ] 1.1.2 定义 `TelegramUpdate` 接口
- [ ] 1.1.3 实现 `TelegramChannel` 类骨架
- [ ] 1.1.4 实现构造函数（接受 `ChannelOpts` 和 `botToken`）
- [ ] 1.1.5 设置 `name` 属性为 "telegram"

### 1.2 实现连接管理
- [ ] 1.2.1 实现 `connect()` 方法
- [ ] 1.2.2 实现 `callAPI()` 辅助方法（使用 fetch）
- [ ] 1.2.3 调用 `getMe` API 验证 Token
- [ ] 1.2.4 处理 401 错误（Invalid bot token）
- [ ] 1.2.5 处理网络错误（Failed to connect）
- [ ] 1.2.6 记录 Bot 信息日志
- [ ] 1.2.7 设置 `connected` 状态为 true
- [ ] 1.2.8 实现 `isConnected()` 方法
- [ ] 1.2.9 实现 `disconnect()` 方法

### 1.3 实现消息接收（Long Polling）
- [ ] 1.3.1 实现 `startPolling()` 方法
- [ ] 1.3.2 实现 `poll()` 循环方法
- [ ] 1.3.3 调用 `getUpdates` API（timeout=30）
- [ ] 1.3.4 实现 `handleUpdate()` 方法
- [ ] 1.3.5 解析 Update 提取消息字段
- [ ] 1.3.6 构建 `IncomingMessage` 对象
- [ ] 1.3.7 识别群组消息（chat.type）
- [ ] 1.3.8 设置 `groupName`（群组消息）
- [ ] 1.3.9 调用 `onMessage` 回调
- [ ] 1.3.10 更新 `currentOffset`
- [ ] 1.3.11 处理 Polling 错误（等待 5 秒重试）

### 1.4 实现消息发送
- [ ] 1.4.1 实现 `sendMessage(jid, text)` 方法
- [ ] 1.4.2 实现 `extractChatId()` 方法
- [ ] 1.4.3 实现 `splitMessage()` 方法（4096 字符限制）
- [ ] 1.4.4 实现 `sendChunk()` 方法
- [ ] 1.4.5 调用 `sendMessage` API（parse_mode: "Markdown"）
- [ ] 1.4.6 处理 400 错误（降级为纯文本）
- [ ] 1.4.7 处理 429 错误（速率限制，等待 retry_after）
- [ ] 1.4.8 处理 403 错误（Bot 被封禁，记录日志）
- [ ] 1.4.9 处理 5xx 错误（重试 3 次）
- [ ] 1.4.10 实现 `sleep()` 辅助方法

### 1.5 实现 JID 管理
- [ ] 1.5.1 实现 `ownsJid(jid)` 方法
- [ ] 1.5.2 检查 JID 是否以 "telegram:" 开头
- [ ] 1.5.3 实现 `formatUserName()` 辅助方法

### 1.6 实现工厂函数和注册
- [ ] 1.6.1 实现 `telegramFactory()` 函数
- [ ] 1.6.2 从环境变量读取 `TELEGRAM_BOT_TOKEN`
- [ ] 1.6.3 Token 不存在时返回 null
- [ ] 1.6.4 调用 `registerChannel("telegram", telegramFactory)`
- [ ] 1.6.5 更新 `src/channels/index.ts` 添加 `import './telegram.js'`

## 2. 单元测试

### 2.1 基础功能测试
- [ ] 2.1.1 创建 `tests/telegram-channel.test.ts`
- [ ] 2.1.2 测试工厂函数（有 Token 返回实例）
- [ ] 2.1.3 测试工厂函数（无 Token 返回 null）
- [ ] 2.1.4 测试 `name` 属性为 "telegram"
- [ ] 2.1.5 测试 `connect()` 调用 `getMe` API
- [ ] 2.1.6 测试 `connect()` 成功后 `isConnected()` 返回 true
- [ ] 2.1.7 测试 `connect()` 401 错误
- [ ] 2.1.8 测试 `connect()` 网络错误
- [ ] 2.1.9 测试 `disconnect()` 后 `isConnected()` 返回 false

### 2.2 消息接收测试
- [ ] 2.2.1 创建 `tests/telegram-receive.test.ts`
- [ ] 2.2.2 测试 `connect()` 后启动 Long Polling
- [ ] 2.2.3 测试 `getUpdates` 调用参数
- [ ] 2.2.4 测试收到 Update 后调用 `onMessage`
- [ ] 2.2.5 测试 IncomingMessage 字段（私聊）
- [ ] 2.2.6 测试 IncomingMessage 字段（群组）
- [ ] 2.2.7 测试 offset 更新
- [ ] 2.2.8 测试 Polling 错误重试

### 2.3 消息发送测试
- [ ] 2.3.1 创建 `tests/telegram-send.test.ts`
- [ ] 2.3.2 测试 `sendMessage()` 调用 API
- [ ] 2.3.3 测试 API 参数包含 `parse_mode: "Markdown"`
- [ ] 2.3.4 测试短消息单次发送
- [ ] 2.3.5 测试长消息分割发送
- [ ] 2.3.6 测试 400 错误降级
- [ ] 2.3.7 测试 429 错误重试
- [ ] 2.3.8 测试 403 错误处理
- [ ] 2.3.9 测试 5xx 错误重试

### 2.4 JID 管理测试
- [ ] 2.4.1 创建 `tests/telegram-jid.test.ts`
- [ ] 2.4.2 测试 `ownsJid("telegram:12345")` 返回 true
- [ ] 2.4.3 测试 `ownsJid("whatsapp:12345")` 返回 false
- [ ] 2.4.4 测试 `extractChatId("telegram:12345")`
- [ ] 2.4.5 测试 `extractChatId("telegram:-100123")`（群组 ID）
- [ ] 2.4.6 测试 `extractChatId("invalid")` 抛出异常

### 2.5 Channel Registry 集成测试
- [ ] 2.5.1 创建 `tests/telegram-registry.test.ts`
- [ ] 2.5.2 测试导入后 `getRegisteredChannelNames()` 包含 "telegram"
- [ ] 2.5.3 测试 `getChannelFactory("telegram")` 返回工厂函数
- [ ] 2.5.4 测试工厂函数返回 TelegramChannel 实例

## 3. 属性测试（可选）

### 3.1 Update 解析属性测试
- [ ] 3.1.1 创建 `tests/properties/telegram-parsing.property.test.ts`
- [ ] 3.1.2 实现 Property 1 测试（Update 解析完整性）
- [ ] 3.1.3 配置 fast-check 运行 100 次迭代

### 3.2 Offset 连续性属性测试
- [ ] 3.2.1 创建 `tests/properties/telegram-offset.property.test.ts`
- [ ] 3.2.2 实现 Property 2 测试（Offset 连续性）
- [ ] 3.2.3 配置 fast-check 运行 100 次迭代

### 3.3 JID 解析属性测试
- [ ] 3.3.1 创建 `tests/properties/telegram-jid.property.test.ts`
- [ ] 3.3.2 实现 Property 3 测试（JID 解析正确性）
- [ ] 3.3.3 配置 fast-check 运行 100 次迭代

### 3.4 消息分割属性测试
- [ ] 3.4.1 创建 `tests/properties/telegram-split.property.test.ts`
- [ ] 3.4.2 实现 Property 4 测试（长消息分割正确性）
- [ ] 3.4.3 配置 fast-check 运行 100 次迭代

### 3.5 JID 所有权属性测试
- [ ] 3.5.1 创建 `tests/properties/telegram-owns.property.test.ts`
- [ ] 3.5.2 实现 Property 5 测试（JID 所有权判断正确性）
- [ ] 3.5.3 配置 fast-check 运行 100 次迭代

### 3.6 群组类型识别属性测试
- [ ] 3.6.1 创建 `tests/properties/telegram-group.property.test.ts`
- [ ] 3.6.2 实现 Property 6 测试（群组类型识别正确性）
- [ ] 3.6.3 配置 fast-check 运行 100 次迭代

### 3.7 Markdown 格式属性测试
- [ ] 3.7.1 创建 `tests/properties/telegram-markdown.property.test.ts`
- [ ] 3.7.2 实现 Property 7 测试（Markdown 格式传递）
- [ ] 3.7.3 配置 fast-check 运行 100 次迭代

## 4. 集成测试和文档（可选）

### 4.1 集成测试
- [ ] 4.1.1 创建 `tests/telegram-integration.test.ts`
- [ ] 4.1.2 实现真实 API 连接测试
- [ ] 4.1.3 实现 `getMe` 调用验证
- [ ] 4.1.4 添加环境变量检查（跳过逻辑）

### 4.2 集成测试文档
- [ ] 4.2.1 创建 `tests/telegram-integration.md`
- [ ] 4.2.2 编写手动测试指南
- [ ] 4.2.3 说明如何获取 Bot Token
- [ ] 4.2.4 说明如何向 Bot 发送消息
- [ ] 4.2.5 说明如何验证响应

## 5. 验收和清理

### 5.1 类型检查
- [ ] 5.1.1 运行 `npm run typecheck` 确保零错误
- [ ] 5.1.2 修复所有 TypeScript 类型问题

### 5.2 测试验收
- [ ] 5.2.1 运行 `npm test` 确保所有测试通过
- [ ] 5.2.2 验证测试覆盖率 ≥ 70%
- [ ] 5.2.3 验证核心模块覆盖率 ≥ 80%

### 5.3 端到端验证
- [ ] 5.3.1 配置真实 Telegram Bot Token
- [ ] 5.3.2 启动系统
- [ ] 5.3.3 向 Bot 发送消息
- [ ] 5.3.4 验证收到 LLM 响应
- [ ] 5.3.5 验证 Markdown 格式正确显示

### 5.4 文档更新
- [ ] 5.4.1 更新 README.md 添加 Telegram 配置说明
- [ ] 5.4.2 更新环境变量文档（TELEGRAM_BOT_TOKEN）
- [ ] 5.4.3 创建 Phase 2 实施总结文档

## 注意事项

1. 所有任务按顺序执行，确保依赖关系正确
2. 单元测试使用 Mock，不依赖真实 API
3. 属性测试标记为可选，可根据时间安排决定是否实现
4. 集成测试需要真实 Bot Token，标记为可选
5. 每个任务完成后运行相关测试验证
6. 遇到问题及时记录并调整方案
