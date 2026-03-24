import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getRegisteredChannelNames, getChannelFactory } from '../src/channels/registry.js';
import { ChannelOpts } from '../src/types.js';

describe('Telegram Channel - Registry Integration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    originalEnv = { ...process.env };
    // 导入 channels/index.ts 触发注册（只需要一次）
    await import('../src/channels/index.js');
  });

  afterAll(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should register telegram channel on import', () => {
    const registeredChannels = getRegisteredChannelNames();
    
    expect(registeredChannels).toContain('telegram');
  });

  it('should return telegram factory from registry', () => {
    const factory = getChannelFactory('telegram');
    
    expect(factory).toBeDefined();
    expect(typeof factory).toBe('function');
  });

  it('should create TelegramChannel instance from factory', () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token-123';
    
    const factory = getChannelFactory('telegram');
    
    const opts: ChannelOpts = {
      onMessage: vi.fn(),
      registeredGroups: vi.fn()
    };
    
    const channel = factory?.(opts);
    
    expect(channel).not.toBeNull();
    expect(channel?.name).toBe('telegram');
  });

  it('should return null from factory when token not set', () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_TOKEN;
    
    const factory = getChannelFactory('telegram');
    
    const opts: ChannelOpts = {
      onMessage: vi.fn(),
      registeredGroups: vi.fn()
    };
    
    const channel = factory?.(opts);
    
    expect(channel).toBeNull();
  });
});
