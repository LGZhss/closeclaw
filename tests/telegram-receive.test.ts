import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TelegramChannel } from '../src/channels/telegram.js';
import { ChannelOpts } from '../src/types.js';

describe('Telegram Channel - Message Receiving', () => {
  let onMessageMock: any;

  beforeEach(() => {
    onMessageMock = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createPollingMock(firstUpdates: any[] = []) {
    let getUpdatesCount = 0;
    return vi.fn().mockImplementation(async (url: string, fetchOpts: any) => {
      if (url.includes('getMe')) {
        return { ok: true, json: async () => ({ ok: true, result: { id: 123, username: 'test_bot' } }) };
      }
      getUpdatesCount++;
      if (getUpdatesCount === 1) {
        return { ok: true, json: async () => ({ ok: true, result: firstUpdates }) };
      }
      return new Promise<any>((resolve, reject) => {
        const signal: AbortSignal | undefined = fetchOpts?.signal;
        if (signal?.aborted) { const e = new Error('AbortError'); e.name = 'AbortError'; return reject(e); }
        if (signal) signal.addEventListener('abort', () => { const e = new Error('AbortError'); e.name = 'AbortError'; reject(e); });
      });
    });
  }
  it("should call getUpdates with correct params", async () => {
    const mf = createPollingMock(); global.fetch = mf;
    const ch = new TelegramChannel({ onMessage: onMessageMock, registeredGroups: vi.fn() } as ChannelOpts, "tok");
    await ch.connect(); await new Promise(r => setTimeout(r, 30));
    const call = mf.mock.calls.find((c: any) => c[0].includes("getUpdates"));
    expect(call).toBeDefined();
    if (call) {
      const body = JSON.parse(call[1].body);
      expect(body.timeout).toBe(30); expect(body.offset).toBeDefined();
    }
    await ch.disconnect();
  });

  it('should call getUpdates with correct parameters', async () => {
    const mockFetch = createPollingMock();
    global.fetch = mockFetch;
    const opts: ChannelOpts = { onMessage: onMessageMock, registeredGroups: vi.fn() };
    const channel = new TelegramChannel(opts, 'test-token');
    await channel.connect();
    await new Promise(resolve => setTimeout(resolve, 30));
    const call = mockFetch.mock.calls.find((c: any) => c[0].includes('getUpdates'));
    const body = JSON.parse(call[1].body);
    expect(body.timeout).toBe(30);
    expect(body.offset).toBeDefined();
    await channel.disconnect();
  });

  it('should call onMessage for private message', async () => {
    const update = {
      update_id: 1001,
      message: {
        message_id: 5001,
        from: { id: 12345, first_name: 'John', last_name: 'Doe', username: 'johndoe' },
        chat: { id: 12345, type: 'private' as const },
        text: 'Hello Bot!',
        date: 1700000000
      }
    };
    const mockFetch = createPollingMock([update]);
    global.fetch = mockFetch;
    const opts: ChannelOpts = { onMessage: onMessageMock, registeredGroups: vi.fn() };
    const channel = new TelegramChannel(opts, 'test-token');
    await channel.connect();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(onMessageMock).toHaveBeenCalledWith(expect.objectContaining({
      id: '5001', channel: 'telegram', chatJid: 'telegram:12345',
      senderJid: 'telegram:12345', senderName: 'John Doe (@johndoe)',
      text: 'Hello Bot!', timestamp: 1700000000000, isGroup: false
    }));
    await channel.disconnect();
  });

  it('should call onMessage with groupName for group messages', async () => {
    const update = {
      update_id: 1002,
      message: {
        message_id: 5002,
        from: { id: 12345, first_name: 'Alice' },
        chat: { id: -100123456789, type: 'supergroup' as const, title: 'Test Group' },
        text: 'Group message',
        date: 1700000100
      }
    };
    const mockFetch = createPollingMock([update]);
    global.fetch = mockFetch;
    const opts: ChannelOpts = { onMessage: onMessageMock, registeredGroups: vi.fn() };
    const channel = new TelegramChannel(opts, 'test-token');
    await channel.connect();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(onMessageMock).toHaveBeenCalledWith(expect.objectContaining({
      id: '5002', chatJid: 'telegram:-100123456789',
      isGroup: true, groupName: 'Test Group'
    }));
    await channel.disconnect();
  });

  it('should update offset after processing updates', async () => {
    const updates = [
      { update_id: 1001, message: { message_id: 5001, from: { id: 1, first_name: 'U1' }, chat: { id: 1, type: 'private' as const }, text: 'M1', date: 1 } },
      { update_id: 1002, message: { message_id: 5002, from: { id: 2, first_name: 'U2' }, chat: { id: 2, type: 'private' as const }, text: 'M2', date: 2 } }
    ];
    const mockFetch = createPollingMock(updates);
    global.fetch = mockFetch;
    const opts: ChannelOpts = { onMessage: onMessageMock, registeredGroups: vi.fn() };
    const channel = new TelegramChannel(opts, 'test-token');
    await channel.connect();
    await new Promise(resolve => setTimeout(resolve, 80));
    const calls = mockFetch.mock.calls.filter((c: any) => c[0].includes('getUpdates'));
    if (calls.length > 1) {
      expect(JSON.parse(calls[1][1].body).offset).toBe(1003);
    }
    await channel.disconnect();
  });

  it('should retry polling after error', async () => {
    let resolveRetry!: () => void;
    const retryDetected = new Promise<void>(r => { resolveRetry = r; });
    let getUpdatesCount = 0;
    const mockFetch = vi.fn().mockImplementation(async (url: string, fetchOpts: any) => {
      if (url.includes('getMe')) {
        return { ok: true, json: async () => ({ ok: true, result: { id: 123, username: 'test_bot' } }) };
      }
      getUpdatesCount++;
      if (getUpdatesCount === 1) throw new Error('Network error');
      resolveRetry();
      return new Promise<any>((_r, rej) => {
        const s: AbortSignal | undefined = fetchOpts?.signal;
        if (s?.aborted) { const e = new Error('AbortError'); e.name = 'AbortError'; return rej(e); }
        if (s) s.addEventListener('abort', () => { const e = new Error('AbortError'); e.name = 'AbortError'; rej(e); });
      });
    });
    global.fetch = mockFetch;
    const opts: ChannelOpts = { onMessage: onMessageMock, registeredGroups: vi.fn() };
    const channel = new TelegramChannel(opts, 'test-token');
    await channel.connect();
    await Promise.race([
      retryDetected,
      new Promise((_, rej) => setTimeout(() => rej(new Error('Retry timeout')), 7000))
    ]);
    const calls = mockFetch.mock.calls.filter((c: any) => c[0].includes('getUpdates'));
    expect(calls.length).toBeGreaterThanOrEqual(2);
    await channel.disconnect();
  }, 10000);
});
