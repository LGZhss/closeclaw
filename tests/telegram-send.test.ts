import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TelegramChannel } from '../src/channels/telegram.js';
import { ChannelOpts } from '../src/types.js';

describe('Telegram Channel - Message Sending', () => {
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call sendMessage API with correct parameters', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        result: { message_id: 1001 }
      })
    });

    const opts: ChannelOpts = {
      onMessage: vi.fn(),
      registeredGroups: vi.fn()
    };
    
    const channel = new TelegramChannel(opts, 'test-token');
    
    await channel.sendMessage('telegram:12345', 'Hello World');
    
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.telegram.org/bottest-token/sendMessage',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
    
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.chat_id).toBe(12345);
    expect(body.text).toBe('Hello World');
    expect(body.parse_mode).toBe('Markdown');
  });

  it('should send short message in single call', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        result: { message_id: 1001 }
      })
    });

    const opts: ChannelOpts = {
      onMessage: vi.fn(),
      registeredGroups: vi.fn()
    };
    
    const channel = new TelegramChannel(opts, 'test-token');
    
    await channel.sendMessage('telegram:12345', 'Short message');
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should split long message into multiple chunks', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        result: { message_id: 1001 }
      })
    });

    const opts: ChannelOpts = {
      onMessage: vi.fn(),
      registeredGroups: vi.fn()
    };
    
    const channel = new TelegramChannel(opts, 'test-token');
    
    // 创建超过 4096 字符的消息
    const longMessage = 'A'.repeat(5000);
    
    await channel.sendMessage('telegram:12345', longMessage);
    
    // 应该分成两次发送
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should retry as plain text on 400 error (Markdown parse error)', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          ok: false,
          description: 'Bad Request: can\'t parse entities'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          result: { message_id: 1001 }
        })
      });

    const opts: ChannelOpts = {
      onMessage: vi.fn(),
      registeredGroups: vi.fn()
    };
    
    const channel = new TelegramChannel(opts, 'test-token');
    
    await channel.sendMessage('telegram:12345', 'Message with *invalid* markdown');
    
    // 第一次调用失败，第二次成功（不带 parse_mode）
    expect(mockFetch).toHaveBeenCalledTimes(2);
    
    const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(secondCallBody.parse_mode).toBeUndefined();
  });

  it('should wait and retry on 429 error (rate limit)', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          ok: false,
          description: 'Too Many Requests',
          parameters: { retry_after: 1 }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          result: { message_id: 1001 }
        })
      });

    const opts: ChannelOpts = {
      onMessage: vi.fn(),
      registeredGroups: vi.fn()
    };
    
    const channel = new TelegramChannel(opts, 'test-token');
    
    const startTime = Date.now();
    await channel.sendMessage('telegram:12345', 'Rate limited message');
    const endTime = Date.now();
    
    // 应该等待至少 1 秒
    expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should throw error on 403 error (bot blocked)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        ok: false,
        description: 'Forbidden: bot was blocked by the user'
      })
    });

    const opts: ChannelOpts = {
      onMessage: vi.fn(),
      registeredGroups: vi.fn()
    };
    
    const channel = new TelegramChannel(opts, 'test-token');
    
    await expect(
      channel.sendMessage('telegram:12345', 'Blocked message')
    ).rejects.toThrow();
  });

  it('should retry on 5xx error up to 3 times', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          ok: false,
          description: 'Internal Server Error'
        })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          ok: false,
          description: 'Internal Server Error'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          result: { message_id: 1001 }
        })
      });

    const opts: ChannelOpts = {
      onMessage: vi.fn(),
      registeredGroups: vi.fn()
    };
    
    const channel = new TelegramChannel(opts, 'test-token');
    
    await channel.sendMessage('telegram:12345', 'Server error message');
    
    // 应该重试 2 次后成功
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should throw error after 3 failed retries on 5xx error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        ok: false,
        description: 'Internal Server Error'
      })
    });

    const opts: ChannelOpts = {
      onMessage: vi.fn(),
      registeredGroups: vi.fn()
    };
    
    const channel = new TelegramChannel(opts, 'test-token');
    
    await expect(
      channel.sendMessage('telegram:12345', 'Persistent error message')
    ).rejects.toThrow();
    
    // 应该尝试 4 次（初始 + 3 次重试）
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });
});
