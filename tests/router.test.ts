import { describe, it, expect, vi } from 'vitest';
import { routeOutbound, escapeXml } from '../src/router.js';
import { Channel } from '../src/types.js';

describe('escapeXml', () => {
  it('should return empty string for falsy input', () => {
    expect(escapeXml('')).toBe('');
    expect(escapeXml(null as any)).toBe('');
    expect(escapeXml(undefined as any)).toBe('');
  });

  it('should return the original string if no special characters are present', () => {
    const input = 'Hello World 123';
    expect(escapeXml(input)).toBe(input);
  });

  it('should escape & correctly', () => {
    expect(escapeXml('Mac & Cheese')).toBe('Mac &amp; Cheese');
  });

  it('should escape < and > correctly', () => {
    expect(escapeXml('<html>')).toBe('&lt;html&gt;');
  });

  it('should escape " correctly', () => {
    expect(escapeXml('"Hello"')).toBe('&quot;Hello&quot;');
  });

  it('should escape multiple occurrences of the same character', () => {
    expect(escapeXml('A & B & C')).toBe('A &amp; B &amp; C');
    expect(escapeXml('<tag></tag>')).toBe('&lt;tag&gt;&lt;/tag&gt;');
    expect(escapeXml('"""""')).toBe('&quot;&quot;&quot;&quot;&quot;');
  });

  it('should escape a mix of special characters', () => {
    const input = '<div class="content">Me & You</div>';
    const expected = '&lt;div class=&quot;content&quot;&gt;Me &amp; You&lt;/div&gt;';
    expect(escapeXml(input)).toBe(expected);
  });
});

describe('routeOutbound', () => {
  it('should send a message via the correct connected channel', async () => {
    const channel1: Channel = {
      name: 'channel1',
      connect: vi.fn(),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      ownsJid: vi.fn().mockReturnValue(false),
      disconnect: vi.fn(),
    };

    const channel2: Channel = {
      name: 'channel2',
      connect: vi.fn(),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      ownsJid: vi.fn().mockReturnValue(true),
      disconnect: vi.fn(),
    };

    const channels = [channel1, channel2];
    const jid = 'user@test.com';
    const text = 'Hello world!';

    await routeOutbound(channels, jid, text);

    expect(channel1.ownsJid).toHaveBeenCalledWith(jid);
    expect(channel1.sendMessage).not.toHaveBeenCalled();

    expect(channel2.ownsJid).toHaveBeenCalledWith(jid);
    expect(channel2.isConnected).toHaveBeenCalled();
    expect(channel2.sendMessage).toHaveBeenCalledWith(jid, text);
  });

  it('should skip a channel if it owns the JID but is not connected', async () => {
    const channel1: Channel = {
      name: 'channel1',
      connect: vi.fn(),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(false),
      ownsJid: vi.fn().mockReturnValue(true),
      disconnect: vi.fn(),
    };

    const channel2: Channel = {
      name: 'channel2',
      connect: vi.fn(),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      ownsJid: vi.fn().mockReturnValue(true),
      disconnect: vi.fn(),
    };

    const channels = [channel1, channel2];
    const jid = 'user@test.com';
    const text = 'Hello world!';

    await routeOutbound(channels, jid, text);

    expect(channel1.sendMessage).not.toHaveBeenCalled();
    expect(channel2.sendMessage).toHaveBeenCalledWith(jid, text);
  });

  it('should throw an error if no channel owns the JID', () => {
    const channel1: Channel = {
      name: 'channel1',
      connect: vi.fn(),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      ownsJid: vi.fn().mockReturnValue(false),
      disconnect: vi.fn(),
    };

    const channels = [channel1];
    const jid = 'user@test.com';
    const text = 'Hello world!';

    expect(() => routeOutbound(channels, jid, text)).toThrowError(
      `No channel for JID: ${jid}`
    );
  });

  it('should throw an error if a channel owns the JID but is not connected and no other connected channels match', () => {
    const channel1: Channel = {
      name: 'channel1',
      connect: vi.fn(),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(false),
      ownsJid: vi.fn().mockReturnValue(true),
      disconnect: vi.fn(),
    };

    const channels = [channel1];
    const jid = 'user@test.com';
    const text = 'Hello world!';

    expect(() => routeOutbound(channels, jid, text)).toThrowError(
      `No channel for JID: ${jid}`
    );
  });
});
