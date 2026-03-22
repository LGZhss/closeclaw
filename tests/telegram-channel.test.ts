import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TelegramChannel, telegramFactory } from '../src/channels/telegram.js';
import { ChannelOpts } from '../src/types.js';

describe('Telegram Channel - Basic Functionality', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockFetch: any;

  beforeEach(() => {
    originalEnv = { ...process.env };
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Factory Function', () => {
    it('should return TelegramChannel instance when TELEGRAM_BOT_TOKEN is set', () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token-123';
      
      const opts: ChannelOpts = {
        onMessage: vi.fn(),
        registeredGroups: vi.fn()
      };
      
      const channel = telegramFactory(opts);
      
      expect(channel).not.toBeNull();
      expect(channel?.name).toBe('telegram');
    });

    it('should return null when TELEGRAM_BOT_TOKEN is not set', () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_TOKEN;
      
      const opts: ChannelOpts = {
        onMessage: vi.fn(),
        registeredGroups: vi.fn()
      };
      
      const channel = telegramFactory(opts);
      
      expect(channel).toBeNull();
    });
  });

  describe('Channel Properties', () => {
    it('should have name property set to "telegram"', () => {
      const opts: ChannelOpts = {
        onMessage: vi.fn(),
        registeredGroups: vi.fn()
      };
      
      const channel = new TelegramChannel(opts, 'test-token');
      
      expect(channel.name).toBe('telegram');
    });
  });

  describe('Connection Management', () => {
    it('should call getMe API on connect', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          result: {
            id: 123456,
            username: 'test_bot',
            first_name: 'Test Bot'
          }
        })
      });

      const opts: ChannelOpts = {
        onMessage: vi.fn(),
        registeredGroups: vi.fn()
      };
      
      const channel = new TelegramChannel(opts, 'test-token');
      
      await channel.connect();
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-token/getMe',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should set isConnected to true after successful connect', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          result: {
            id: 123456,
            username: 'test_bot',
            first_name: 'Test Bot'
          }
        })
      });

      const opts: ChannelOpts = {
        onMessage: vi.fn(),
        registeredGroups: vi.fn()
      };
      
      const channel = new TelegramChannel(opts, 'test-token');
      
      expect(channel.isConnected()).toBe(false);
      
      await channel.connect();
      
      expect(channel.isConnected()).toBe(true);
    });

    it('should throw "Invalid bot token" on 401 error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          ok: false,
          description: 'Unauthorized'
        })
      });

      const opts: ChannelOpts = {
        onMessage: vi.fn(),
        registeredGroups: vi.fn()
      };
      
      const channel = new TelegramChannel(opts, 'invalid-token');
      
      await expect(channel.connect()).rejects.toThrow('Invalid bot token');
    });

    it('should throw "Failed to connect to Telegram" on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const opts: ChannelOpts = {
        onMessage: vi.fn(),
        registeredGroups: vi.fn()
      };
      
      const channel = new TelegramChannel(opts, 'test-token');
      
      await expect(channel.connect()).rejects.toThrow('Failed to connect to Telegram');
    });

    it('should set isConnected to false after disconnect', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          result: {
            id: 123456,
            username: 'test_bot',
            first_name: 'Test Bot'
          }
        })
      });

      const opts: ChannelOpts = {
        onMessage: vi.fn(),
        registeredGroups: vi.fn()
      };
      
      const channel = new TelegramChannel(opts, 'test-token');
      
      await channel.connect();
      expect(channel.isConnected()).toBe(true);
      
      await channel.disconnect();
      expect(channel.isConnected()).toBe(false);
    });
  });
});
