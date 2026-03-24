import { Channel, ChannelOpts, IncomingMessage } from '../types.js';
import { registerChannel } from './registry.js';
import { log } from '../logger.js';

/**
 * Telegram Update 结构（简化）
 */
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: 'private' | 'group' | 'supergroup' | 'channel';
      title?: string;
    };
    text?: string;
    date: number;
  };
}

/**
 * Telegram Channel 实现
 */
export class TelegramChannel implements Channel {
  name = 'telegram';
  
  private botToken: string;
  private connected = false;
  private pollingActive = false;
  private currentOffset = 0;
  private onMessage: (message: IncomingMessage) => Promise<void>;
  private abortController: AbortController | null = null;
  
  constructor(opts: ChannelOpts, botToken: string) {
    this.botToken = botToken;
    this.onMessage = opts.onMessage;
  }

  async connect(): Promise<void> {
    log('[Telegram] Connecting...', 'INFO');
    
    try {
      // 验证 Bot Token
      const response = await this.callAPI('getMe');
      const botInfo = response.result;
      
      log(`[Telegram] Connected as @${botInfo.username} (ID: ${botInfo.id})`, 'INFO');
      
      this.connected = true;
      
      // 启动 Long Polling
      this.startPolling();
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid bot token');
      }
      throw new Error('Failed to connect to Telegram');
    }
  }
  
  async disconnect(): Promise<void> {
    log('[Telegram] Disconnecting...', 'INFO');
    this.pollingActive = false;
    this.connected = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  ownsJid(jid: string): boolean {
    return jid.startsWith('telegram:');
  }
  
  async sendMessage(jid: string, text: string): Promise<void> {
    const chatId = this.extractChatId(jid);
    const chunks = this.splitMessage(text);
    
    for (const chunk of chunks) {
      await this.sendChunk(chatId, chunk);
    }
  }
  
  private async sendChunk(chatId: number, text: string, retryCount = 0): Promise<void> {
    try {
      await this.callAPI('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      });
    } catch (error: any) {
      // 400: Markdown 格式错误，降级为纯文本
      if (error.response?.status === 400) {
        log('[Telegram] Markdown parse error, retrying as plain text', 'WARN');
        await this.callAPI('sendMessage', {
          chat_id: chatId,
          text
        });
        return;
      }
      
      // 429: 速率限制
      if (error.response?.status === 429) {
        const retryAfter = error.response.data?.parameters?.retry_after || 5;
        log(`[Telegram] Rate limited, waiting ${retryAfter}s`, 'WARN');
        await this.sleep(retryAfter * 1000);
        await this.sendChunk(chatId, text, retryCount);
        return;
      }
      
      // 403: Bot 被封禁
      if (error.response?.status === 403) {
        log(`[Telegram] Bot blocked by user ${chatId}`, 'ERROR');
        throw error;
      }
      
      // 5xx: 服务器错误，重试
      if (error.response?.status >= 500 && retryCount < 3) {
        log(`[Telegram] Server error, retry ${retryCount + 1}/3`, 'WARN');
        await this.sleep(1000);
        await this.sendChunk(chatId, text, retryCount + 1);
        return;
      }
      
      log(`[Telegram] Send message failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  private startPolling(): void {
    this.pollingActive = true;
    this.abortController = new AbortController();
    // 启动背景轮询，不等待其结束
    void this.poll();
  }
  
  private async poll(): Promise<void> {
    while (this.pollingActive) {
      try {
        const response = await this.callAPI('getUpdates', {
          offset: this.currentOffset,
          timeout: 30
        }, this.abortController?.signal);
        
        const updates: TelegramUpdate[] = response.result;
        
        for (const update of updates) {
          await this.handleUpdate(update);
          this.currentOffset = update.update_id + 1;
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || !this.pollingActive) break;
        log(`[Telegram] Polling error: ${error.message}`, 'ERROR');
        await this.sleep(5000);
      }
    }
  }
  
  private async handleUpdate(update: TelegramUpdate): Promise<void> {
    if (!update.message || !update.message.text) {
      return;
    }
    
    const msg = update.message;
    const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
    
    const incomingMessage: IncomingMessage = {
      id: String(msg.message_id),
      channel: 'telegram',
      chatJid: `telegram:${msg.chat.id}`,
      senderJid: `telegram:${msg.from.id}`,
      senderName: this.formatUserName(msg.from),
      text: msg.text!,
      timestamp: msg.date * 1000,
      isGroup,
      ...(isGroup && { groupName: msg.chat.title })
    };
    
    await this.onMessage(incomingMessage);
  }
  
  private formatUserName(user: { first_name: string; last_name?: string; username?: string }): string {
    const parts = [user.first_name];
    if (user.last_name) parts.push(user.last_name);
    if (user.username) parts.push(`(@${user.username})`);
    return parts.join(' ');
  }
  
  private extractChatId(jid: string): number {
    const match = jid.match(/^telegram:(-?\d+)$/);
    if (!match) {
      throw new Error(`Invalid Telegram JID: ${jid}`);
    }
    return parseInt(match[1], 10);
  }
  
  private splitMessage(text: string): string[] {
    const MAX_LENGTH = 4096;
    if (text.length <= MAX_LENGTH) {
      return [text];
    }
    
    const chunks: string[] = [];
    let remaining = text;
    
    while (remaining.length > 0) {
      if (remaining.length <= MAX_LENGTH) {
        chunks.push(remaining);
        break;
      }
      
      // 尝试在换行符处分割
      let splitIndex = remaining.lastIndexOf('\n', MAX_LENGTH);
      if (splitIndex === -1 || splitIndex < MAX_LENGTH / 2) {
        splitIndex = MAX_LENGTH;
      }
      
      chunks.push(remaining.substring(0, splitIndex));
      remaining = remaining.substring(splitIndex);
    }
    
    return chunks;
  }

  private async callAPI(method: string, params: Record<string, any> = {}, signal?: AbortSignal): Promise<any> {
    const url = `https://api.telegram.org/bot${this.botToken}/${method}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal
    });
    
    const data = await response.json() as any;
    
    if (!data.ok) {
      const error: any = new Error(data.description || 'Telegram API error');
      error.response = { status: response.status, data };
      throw error;
    }
    
    return data;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Telegram Channel 工厂函数
 */
export function telegramFactory(opts: ChannelOpts): Channel | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
  
  if (!botToken) {
    log('[Telegram] TELEGRAM_BOT_TOKEN not configured', 'WARN');
    return null;
  }
  
  return new TelegramChannel(opts, botToken);
}

// 自动注册至 Channel Registry
registerChannel('telegram', telegramFactory);
