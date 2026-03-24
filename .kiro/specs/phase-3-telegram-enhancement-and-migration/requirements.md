# Phase 3: Telegram 增强 + 部分 TS 迁移 - 需求文档

> **Feature**: phase-3-telegram-enhancement-and-migration  
> **状态**: 📝 规划中  
> **创建日期**: 2026-03-22  
> **基于**: 提案 020 + NanoClaw 对比分析

---

## 📋 概述

Phase 3 包含两个主要目标：
1. **Telegram Channel 增强** - 借鉴 NanoClaw 的优秀特性，提升用户体验
2. **高优先级 JS → TS 迁移** - 迁移 Adapter 层和 Sandbox 层

---

## 🎯 业务需求

### 需求 1: Telegram Channel 功能增强

**用户故事 1.1**: 作为用户，我希望能轻松获取聊天 ID，以便注册新的 Telegram 群组。

**验收标准**:
- [ ] 用户可以向机器人发送 `/chatid` 命令
- [ ] 机器人回复当前聊天的 ID（格式：`telegram:123456789`）
- [ ] 私聊和群组都支持此命令
- [ ] 回复包含聊天名称和类型

**用户故事 1.2**: 作为用户，我希望机器人能识别媒体消息，而不是忽略它们。

**验收标准**:
- [ ] 图片消息显示为 `[Photo]`
- [ ] 视频消息显示为 `[Video]`
- [ ] 语音消息显示为 `[Voice message]`
- [ ] 文档消息显示为 `[Document: filename]`
- [ ] 贴纸消息显示为 `[Sticker emoji]`
- [ ] 位置消息显示为 `[Location]`
- [ ] 联系人消息显示为 `[Contact]`
- [ ] 媒体消息的 caption 会被保留

**用户故事 1.3**: 作为用户，我希望在群组中 @机器人时能自动触发响应。

**验收标准**:
- [ ] 检测 Telegram @mention（如 `@andy_bot`）
- [ ] 自动转换为触发词格式（如 `@Andy`）
- [ ] 群组中 @机器人等同于使用触发词
- [ ] 不影响现有触发词逻辑

**用户故事 1.4**: 作为用户，我希望看到机器人"正在输入"的状态。

**验收标准**:
- [ ] 机器人开始生成回复时显示"正在输入"
- [ ] 发送消息后停止显示
- [ ] 不影响消息发送性能

**用户故事 1.5**: 作为用户，我希望能检查机器人是否在线。

**验收标准**:
- [ ] 用户可以发送 `/ping` 命令
- [ ] 机器人回复 "CloseClaw is online."
- [ ] 响应时间 < 1 秒

### 需求 2: Adapter 层 TS 迁移

**用户故事 2.1**: 作为开发者，我希望所有 LLM Adapter 都是 TypeScript，以便更好的类型安全。

**验收标准**:
- [ ] `claude.js` → `claude.ts`
- [ ] `gemini.js` → `gemini.ts`
- [ ] `local.js` → `local.ts`
- [ ] 所有 Adapter 实现 `LLMAdapter` 接口
- [ ] 自动注册到 AdapterRegistry
- [ ] TypeScript 编译零错误

### 需求 3: Sandbox 层 TS 迁移

**用户故事 3.1**: 作为开发者，我希望 Sandbox 层是 TypeScript，以便更好的类型定义。

**验收标准**:
- [ ] `sandboxManager.js` → `sandboxManager.ts`
- [ ] `processExecutor.js` → `processExecutor.ts`
- [ ] 定义 `ISandboxManager` 和 `IProcessExecutor` 接口
- [ ] 与 SandboxRunner 集成
- [ ] TypeScript 编译零错误

---

## 🔧 技术需求

### 技术需求 1: Telegram Bot 命令系统

**要求**:
- 使用 Telegram Bot API 的 `setMyCommands` 注册命令
- 命令处理逻辑与普通消息分离
- 命令响应不存储到数据库

**命令列表**:
- `/chatid` - 获取当前聊天 ID
- `/ping` - 检查机器人状态

### 技术需求 2: 媒体消息处理

**要求**:
- 检测消息类型（photo, video, voice, audio, document, sticker, location, contact）
- 生成占位符文本
- 保留 caption（如果有）
- 存储到数据库供 AI 处理

### 技术需求 3: @mention 检测

**要求**:
- 解析 Telegram entities（类型为 `mention`）
- 提取 @username
- 与机器人 username 比较
- 自动添加触发词前缀

### 技术需求 4: 打字状态

**要求**:
- 调用 `sendChatAction` API
- 动作类型：`typing`
- 在生成回复前调用
- 错误不影响消息发送

### 技术需求 5: TypeScript 迁移

**要求**:
- 保持 API 兼容性
- 补全类型定义
- 编写单元测试
- 更新导入路径

---

## 📊 正确性属性

### 属性 1: Bot 命令响应正确性

**属性**: 对于所有支持的命令，机器人必须返回正确的响应。

**测试方法**:
```typescript
// Property: /chatid 返回正确的聊天 ID
fc.assert(
  fc.property(fc.integer(), (chatId) => {
    const response = handleChatIdCommand(chatId);
    return response.includes(`telegram:${chatId}`);
  })
);
```

### 属性 2: 媒体消息占位符正确性

**属性**: 对于所有媒体类型，必须生成正确的占位符。

**测试方法**:
```typescript
// Property: 媒体消息生成正确占位符
const mediaTypes = ['photo', 'video', 'voice', 'audio', 'document', 'sticker', 'location', 'contact'];
for (const type of mediaTypes) {
  const placeholder = getMediaPlaceholder(type);
  assert(placeholder.startsWith('[') && placeholder.endsWith(']'));
}
```

### 属性 3: @mention 转换正确性

**属性**: 检测到 @mention 时，必须正确转换为触发词格式。

**测试方法**:
```typescript
// Property: @mention 转换为触发词
fc.assert(
  fc.property(fc.string(), (username) => {
    const content = `@${username} hello`;
    const converted = convertMention(content, username);
    return converted.startsWith('@CloseClaw');
  })
);
```

### 属性 4: TypeScript 类型安全

**属性**: 所有迁移的模块必须通过 TypeScript 编译。

**测试方法**:
```bash
npm run typecheck
# 必须零错误
```

---

## 🎯 成功标准

### Telegram 增强成功标准

- [ ] 所有 Bot 命令正常工作
- [ ] 媒体消息正确显示占位符
- [ ] @mention 自动触发响应
- [ ] 打字状态正常显示
- [ ] 所有现有测试通过
- [ ] 新增测试覆盖率 ≥ 80%

### TS 迁移成功标准

- [ ] 所有 Adapter 迁移完成
- [ ] 所有 Sandbox 模块迁移完成
- [ ] TypeScript 编译零错误
- [ ] 所有单元测试通过
- [ ] 集成测试通过
- [ ] 代码覆盖率 ≥ 80%

---

## 📚 参考资料

- [NanoClaw Telegram 实现](https://github.com/qwibitai/nanoclaw-telegram)
- [Telegram Bot API 文档](https://core.telegram.org/bots/api)
- [提案 020 - 架构解耦蓝图](../../votes/proposal-020-architecture-decouple-blueprint.md)
- [Telegram 实现对比分析](../../docs/TELEGRAM_IMPL_COMPARISON.md)
- [Phase 3 实施计划](../../docs/phase-3-implementation-plan.md)

---

## 🔄 依赖关系

### 前置条件
- ✅ Phase 0 完成（Bug 修复）
- ✅ Phase 1 完成（Agent 执行链路）
- ✅ Phase 2 完成（Telegram Channel 基础实现）

### 后续阶段
- Phase 4: 完整 TS 迁移（Tools 层、Core 层废弃）
- Phase 5: 模块化重构（db.ts, task-scheduler.ts）

---

## ⚠️ 风险与缓解

### 风险 1: Telegram API 变更
- **影响**: Bot 命令或媒体处理可能失效
- **缓解**: 使用稳定的 API 版本，添加错误处理

### 风险 2: TypeScript 迁移破坏兼容性
- **影响**: 现有代码可能无法调用迁移后的模块
- **缓解**: 保持 API 兼容，充分测试

### 风险 3: 性能影响
- **影响**: 打字状态和媒体处理可能增加延迟
- **缓解**: 异步处理，错误不阻塞主流程

---

## 📅 时间估算

| 任务 | 估算时间 |
|------|----------|
| Telegram Bot 命令 | 2 小时 |
| 媒体消息处理 | 3 小时 |
| @mention 处理 | 2 小时 |
| 打字状态 | 1 小时 |
| Adapter 层迁移 | 4 小时 |
| Sandbox 层迁移 | 3 小时 |
| 测试编写 | 4 小时 |
| 文档更新 | 1 小时 |
| **总计** | **20 小时** |

---

## ✅ 验收检查清单

### Telegram 增强
- [ ] `/chatid` 命令正常工作
- [ ] `/ping` 命令正常工作
- [ ] 图片消息显示 `[Photo]`
- [ ] 视频消息显示 `[Video]`
- [ ] 语音消息显示 `[Voice message]`
- [ ] @mention 自动触发
- [ ] 打字状态显示

### TS 迁移
- [ ] `claude.ts` 实现完成
- [ ] `gemini.ts` 实现完成
- [ ] `local.ts` 实现完成
- [ ] `sandboxManager.ts` 实现完成
- [ ] `processExecutor.ts` 实现完成
- [ ] 所有测试通过
- [ ] TypeScript 编译零错误

### 质量保证
- [ ] 代码覆盖率 ≥ 80%
- [ ] 所有 lint 检查通过
- [ ] 文档更新完成
- [ ] PR 审查通过
