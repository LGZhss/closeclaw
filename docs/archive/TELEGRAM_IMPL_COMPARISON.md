# Telegram Channel 实现对比：NanoClaw vs CloseClaw

> **分析日期**: 2026-03-22  
> **目的**: 对比两个实现的优劣，获取改进启示

---

## 📊 总体对比

| 特性 | NanoClaw (grammy) | CloseClaw (原生 fetch) |
|------|-------------------|------------------------|
| **依赖** | `grammy` 库 | 无外部依赖 |
| **代码行数** | ~350 行 | ~250 行 |
| **消息处理** | 完整（支持所有类型） | 简化（仅文本） |
| **Bot 命令** | 内置 `/chatid`, `/ping` | 无 |
| **错误处理** | 基础 | 完善（重试、降级） |
| **JID 格式** | `tg:` | `telegram:` |
| **类型安全** | 部分 | 完整 |

---

## 🔍 详细对比

### 1. 依赖管理

#### NanoClaw
```typescript
import { Api, Bot } from 'grammy';
```
- 依赖 `grammy` 库（~200KB）
- 提供完整的 Bot API 封装
- 内置类型定义

#### CloseClaw
```typescript
// 无外部依赖，使用原生 fetch
const response = await fetch(url, {...});
```
- 无额外依赖
- 使用原生 Web API
- 代码更轻量

**结论**: CloseClaw 胜（零依赖）

---

### 2. 消息接收（Long Polling）

#### NanoClaw (使用 grammy)
```typescript
this.bot.on('message:text', async (ctx) => {
  // 直接处理消息
  const content = ctx.message.text;
  const chatJid = `tg:${ctx.chat.id}`;
  // ...
});
```
- 使用 grammy 的事件系统
- 自动处理 offset 管理
- 代码简洁

#### CloseClaw (原生实现)
```typescript
private async poll(): Promise<void> {
  while (this.pollingActive) {
    const response = await this.callAPI('getUpdates', {
      offset: this.currentOffset,
      timeout: 30
    });
    // 手动管理 offset
    this.currentOffset = update.update_id + 1;
  }
}
```
- 手动实现 Long Polling
- 更灵活，可定制
- 需要更多代码

**结论**: NanoClaw 胜（更简洁）

---

### 3. 消息发送

#### NanoClaw
```typescript
async function sendTelegramMessage(api, chatId, text, options) {
  try {
    await api.sendMessage(chatId, text, {
      ...options,
      parse_mode: 'Markdown',
    });
  } catch (err) {
    // 降级到纯文本
    await api.sendMessage(chatId, text, options);
  }
}
```
- 基础 Markdown 降级
- 消息分片（4096 字符）

#### CloseClaw
```typescript
private async sendChunk(chatId: number, text: string, retryCount = 0): Promise<void> {
  try {
    await this.callAPI('sendMessage', {...});
  } catch (error: any) {
    // 400: Markdown 错误，降级
    if (error.response?.status === 400) {
      await this.callAPI('sendMessage', { text });
      return;
    }
    // 429: 速率限制，等待重试
    if (error.response?.status === 429) {
      const retryAfter = error.response.data?.parameters?.retry_after || 5;
      await this.sleep(retryAfter * 1000);
      await this.sendChunk(chatId, text, retryCount);
      return;
    }
    // 5xx: 服务器错误，重试
    if (error.response?.status >= 500 && retryCount < 3) {
      await this.sleep(1000);
      await this.sendChunk(chatId, text, retryCount + 1);
      return;
    }
  }
}
```
- 完善的错误处理
- 速率限制处理
- 自动重试机制

**结论**: CloseClaw 胜（更健壮）

---

### 4. 消息类型支持

#### NanoClaw
```typescript
this.bot.on('message:photo', (ctx) => storeNonText(ctx, '[Photo]'));
this.bot.on('message:video', (ctx) => storeNonText(ctx, '[Video]'));
this.bot.on('message:voice', (ctx) => storeNonText(ctx, '[Voice message]'));
this.bot.on('message:audio', (ctx) => storeNonText(ctx, '[Audio]'));
this.bot.on('message:document', (ctx) => storeNonText(ctx, '[Document: ...]'));
this.bot.on('message:sticker', (ctx) => storeNonText(ctx, '[Sticker ...]'));
this.bot.on('message:location', (ctx) => storeNonText(ctx, '[Location]'));
this.bot.on('message:contact', (ctx) => storeNonText(ctx, '[Contact]'));
```
- 支持所有消息类型
- 用占位符表示非文本内容

#### CloseClaw
```typescript
// 仅处理文本消息
private async handleUpdate(update: TelegramUpdate): Promise<void> {
  if (!update.message || !update.message.text) {
    return;  // 忽略非文本消息
  }
  // ...
}
```
- 仅支持文本
- 忽略其他类型

**结论**: NanoClaw 胜（功能完整）

---

### 5. Bot 命令支持

#### NanoClaw
```typescript
// Command to get chat ID
this.bot.command('chatid', (ctx) => {
  const chatId = ctx.chat.id;
  ctx.reply(`Chat ID: \`tg:${chatId}\`...`);
});

// Command to check bot status
this.bot.command('ping', (ctx) => {
  ctx.reply(`${ASSISTANT_NAME} is online.`);
});
```
- 内置 `/chatid` 命令（获取聊天 ID）
- 内置 `/ping` 命令（检查状态）
- 用户可自行添加更多命令

#### CloseClaw
```typescript
// 无命令支持
```
- 无内置命令
- 无法获取聊天 ID

**结论**: NanoClaw 胜（用户体验好）

---

### 6. @mention 处理

#### NanoClaw
```typescript
// 翻译 Telegram @bot_username mentions 为触发词格式
const botUsername = ctx.me?.username?.toLowerCase();
if (botUsername) {
  const isBotMentioned = entities.some((entity) => {
    if (entity.type === 'mention') {
      const mentionText = content.substring(entity.offset, entity.offset + entity.length).toLowerCase();
      return mentionText === `@${botUsername}`;
    }
    return false;
  });
  if (isBotMentioned && !TRIGGER_PATTERN.test(content)) {
    content = `@${ASSISTANT_NAME} ${content}`;
  }
}
```
- 自动检测 @mention
- 转换为触发词格式
- 支持群组中 @机器人触发

#### CloseClaw
```typescript
// 无 @mention 处理
```
- 依赖外部路由处理触发词

**结论**: NanoClaw 胜（更好的触发体验）

---

### 7. JID 格式

#### NanoClaw
```typescript
const chatJid = `tg:${ctx.chat.id}`;
```
- 使用 `tg:` 前缀
- 与 WhatsApp 兼容（`wa:`）

#### CloseClaw
```typescript
const chatJid = `telegram:${msg.chat.id}`;
```
- 使用 `telegram:` 前缀
- 更明确，不与其他通道冲突

**结论**: 各有优劣（CloseClaw 更明确，NanoClaw 更简洁）

---

### 8. 打字状态

#### NanoClaw
```typescript
async setTyping(jid: string, isTyping: boolean): Promise<void> {
  if (!this.bot || !isTyping) return;
  const numericId = jid.replace(/^tg:/, '');
  await this.bot.api.sendChatAction(numericId, 'typing');
}
```
- 支持显示"正在输入"

#### CloseClaw
```typescript
// 无实现
```
- 无打字状态

**结论**: NanoClaw 胜（用户体验好）

---

## 📊 功能对比表

| 功能 | NanoClaw | CloseClaw | 胜者 |
|------|----------|-----------|------|
| 依赖大小 | ~200KB | 0 | CloseClaw |
| 代码简洁 | ✅ | ✅ | NanoClaw |
| 文本消息 | ✅ | ✅ | 平 |
| 媒体消息 | ✅ | ❌ | NanoClaw |
| Bot 命令 | ✅ | ❌ | NanoClaw |
| @mention 处理 | ✅ | ❌ | NanoClaw |
| 错误重试 | 基础 | 完善 | CloseClaw |
| 速率限制 | 无 | ✅ | CloseClaw |
| 打字状态 | ✅ | ❌ | NanoClaw |
| 类型安全 | 部分 | 完整 | CloseClaw |

---

## 🎯 改进启示

### CloseClaw 可以借鉴 NanoClaw 的功能

1. **添加 Bot 命令支持**
   - `/chatid` - 获取当前聊天 ID
   - `/ping` - 检查机器人状态

2. **支持非文本消息**
   - 图片、视频、语音等用占位符表示
   - 让 AI 知道收到了什么

3. **@mention 自动转换**
   - 检测 Telegram @mention
   - 转换为触发词格式

4. **打字状态**
   - 发送消息时显示"正在输入"

5. **统一 JID 格式**
   - 考虑使用 `tg:` 与 NanoClaw 兼容

### NanoClaw 可以借鉴 CloseClaw 的特性

1. **减少依赖**
   - 考虑使用轻量级方案
   - 但 grammy 已经很稳定

2. **增强错误处理**
   - 添加速率限制处理
   - 添加自动重试

---

## 🎯 结论

### 两者定位不同

| | NanoClaw | CloseClaw |
|---|---|---|
| **目标** | 功能完整的企业级 | 轻量级最小化 |
| **依赖** | grammy 库 | 无依赖 |
| **功能** | 完整 | 基础 |
| **维护** | 外部仓库 | 主仓库 |

### 建议

CloseClaw 当前实现适合快速上手和轻量使用。如果需要更完整的功能（媒体消息、Bot 命令等），可以：

1. **短期**: 添加 Bot 命令和 @mention 处理
2. **长期**: 考虑引入 grammy 库或保持当前方案

当前 CloseClaw 实现已经满足基本需求，错误处理比 NanoClaw 更健壮。