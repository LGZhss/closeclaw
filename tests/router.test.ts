import { describe, it, expect, vi } from "vitest";
import { routeOutbound, escapeXml, findChannelForJid } from "../src/router.js";
import { Channel } from "../src/types.js";

describe("findChannelForJid", () => {
  it("should return the matching channel when one owns the JID", () => {
    const channel1 = {
      name: "channel1",
      connect: vi.fn(),
      sendMessage: vi.fn(),
      isConnected: vi.fn(),
      ownsJid: vi.fn().mockReturnValue(false),
      disconnect: vi.fn(),
    } as unknown as Channel;

    const channel2 = {
      name: "channel2",
      connect: vi.fn(),
      sendMessage: vi.fn(),
      isConnected: vi.fn(),
      ownsJid: vi.fn().mockReturnValue(true),
      disconnect: vi.fn(),
    } as unknown as Channel;

    const channels = [channel1, channel2];
    const result = findChannelForJid("user@test.com", channels);

    expect(result).toBe(channel2);
    expect(channel1.ownsJid).toHaveBeenCalledWith("user@test.com");
    expect(channel2.ownsJid).toHaveBeenCalledWith("user@test.com");
  });

  it("should return null when no channel owns the JID", () => {
    const channel1 = {
      name: "channel1",
      connect: vi.fn(),
      sendMessage: vi.fn(),
      isConnected: vi.fn(),
      ownsJid: vi.fn().mockReturnValue(false),
      disconnect: vi.fn(),
    } as unknown as Channel;

    const channels = [channel1];
    const result = findChannelForJid("user@test.com", channels);

    expect(result).toBeNull();
    expect(channel1.ownsJid).toHaveBeenCalledWith("user@test.com");
  });

  it("should return null when channels array is empty", () => {
    const result = findChannelForJid("user@test.com", []);
    expect(result).toBeNull();
  });

  it("should return the first matching channel when multiple channels own the JID", () => {
    const channel1 = {
      name: "channel1",
      connect: vi.fn(),
      sendMessage: vi.fn(),
      isConnected: vi.fn(),
      ownsJid: vi.fn().mockReturnValue(true),
      disconnect: vi.fn(),
    } as unknown as Channel;

    const channel2 = {
      name: "channel2",
      connect: vi.fn(),
      sendMessage: vi.fn(),
      isConnected: vi.fn(),
      ownsJid: vi.fn().mockReturnValue(true),
      disconnect: vi.fn(),
    } as unknown as Channel;

    const channels = [channel1, channel2];
    const result = findChannelForJid("user@test.com", channels);

    expect(result).toBe(channel1);
    expect(channel1.ownsJid).toHaveBeenCalledWith("user@test.com");
    // The second channel shouldn't be checked because the first one matched
    expect(channel2.ownsJid).not.toHaveBeenCalled();
  });
});

describe("escapeXml", () => {
  it("should return empty string for falsy input", () => {
    expect(escapeXml("")).toBe("");
    expect(escapeXml(null as any)).toBe("");
    expect(escapeXml(undefined as any)).toBe("");
  });

  it("should return the original string if no special characters are present", () => {
    const input = "Hello World 123";
    expect(escapeXml(input)).toBe(input);
  });

  it("should escape & correctly", () => {
    expect(escapeXml("Mac & Cheese")).toBe("Mac &amp; Cheese");
  });

  it("should escape < and > correctly", () => {
    expect(escapeXml("<html>")).toBe("&lt;html&gt;");
  });

  it('should escape " correctly', () => {
    expect(escapeXml('"Hello"')).toBe("&quot;Hello&quot;");
  });

  it("should escape multiple occurrences of the same character", () => {
    expect(escapeXml("A & B & C")).toBe("A &amp; B &amp; C");
    expect(escapeXml("<tag></tag>")).toBe("&lt;tag&gt;&lt;/tag&gt;");
    expect(escapeXml('"""""')).toBe("&quot;&quot;&quot;&quot;&quot;");
  });

  it("should escape a mix of special characters", () => {
    const input = '<div class="content">Me & You</div>';
    const expected =
      "&lt;div class=&quot;content&quot;&gt;Me &amp; You&lt;/div&gt;";
    expect(escapeXml(input)).toBe(expected);
  });
});

describe("routeOutbound", () => {
  it("should send a message via the correct connected channel", async () => {
    const channel1: Channel = {
      name: "channel1",
      connect: vi.fn(),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      ownsJid: vi.fn().mockReturnValue(false),
      disconnect: vi.fn(),
    };

    const channel2: Channel = {
      name: "channel2",
      connect: vi.fn(),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      ownsJid: vi.fn().mockReturnValue(true),
      disconnect: vi.fn(),
    };

    const channels = [channel1, channel2];
    const jid = "user@test.com";
    const text = "Hello world!";

    await routeOutbound(channels, jid, text);

    expect(channel1.ownsJid).toHaveBeenCalledWith(jid);
    expect(channel1.sendMessage).not.toHaveBeenCalled();

    expect(channel2.ownsJid).toHaveBeenCalledWith(jid);
    expect(channel2.isConnected).toHaveBeenCalled();
    expect(channel2.sendMessage).toHaveBeenCalledWith(jid, text);
  });

  it("should skip a channel if it owns the JID but is not connected", async () => {
    const channel1: Channel = {
      name: "channel1",
      connect: vi.fn(),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(false),
      ownsJid: vi.fn().mockReturnValue(true),
      disconnect: vi.fn(),
    };

    const channel2: Channel = {
      name: "channel2",
      connect: vi.fn(),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      ownsJid: vi.fn().mockReturnValue(true),
      disconnect: vi.fn(),
    };

    const channels = [channel1, channel2];
    const jid = "user@test.com";
    const text = "Hello world!";

    await routeOutbound(channels, jid, text);

    expect(channel1.sendMessage).not.toHaveBeenCalled();
    expect(channel2.sendMessage).toHaveBeenCalledWith(jid, text);
  });

  it("should throw an error if no channel owns the JID", () => {
    const channel1: Channel = {
      name: "channel1",
      connect: vi.fn(),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      ownsJid: vi.fn().mockReturnValue(false),
      disconnect: vi.fn(),
    };

    const channels = [channel1];
    const jid = "user@test.com";
    const text = "Hello world!";

    expect(() => routeOutbound(channels, jid, text)).toThrowError(
      `No channel for JID: ${jid}`,
    );
  });

  it("should throw an error if a channel owns the JID but is not connected and no other connected channels match", () => {
    const channel1: Channel = {
      name: "channel1",
      connect: vi.fn(),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(false),
      ownsJid: vi.fn().mockReturnValue(true),
      disconnect: vi.fn(),
    };

    const channels = [channel1];
    const jid = "user@test.com";
    const text = "Hello world!";

    expect(() => routeOutbound(channels, jid, text)).toThrowError(
      `No channel for JID: ${jid}`,
    );
  });
});

describe('formatMessages', () => {
  const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const createMockDbMessage = (overrides: Partial<DbMessage> = {}): DbMessage => ({
    id: 1,
    channel: 'test-channel',
    chat_jid: 'test@g.us',
    sender_jid: 'sender@s.whatsapp.net',
    sender_name: 'TestUser',
    text: 'Hello',
    timestamp: 1620000000000,
    is_group: true,
    processed: false,
    created_at: new Date().toISOString(),
    ...overrides,
  });

  it('should return empty string for an empty array', () => {
    expect(formatMessages([])).toBe('');
  });

  it('should format a single message correctly', () => {
    const msg = createMockDbMessage({ timestamp: 1620000000000, sender_name: 'Alice', text: 'Hi there' });
    const timeStr = dateFormatter.format(msg.timestamp);
    const expected = `[${timeStr}] Alice: Hi there`;

    expect(formatMessages([msg])).toBe(expected);
  });

  it('should join multiple messages with a newline', () => {
    const msg1 = createMockDbMessage({ timestamp: 1620000000000, sender_name: 'Alice', text: 'Hi' });
    const msg2 = createMockDbMessage({ timestamp: 1620000060000, sender_name: 'Bob', text: 'Hello Alice' });

    const timeStr1 = dateFormatter.format(msg1.timestamp);
    const timeStr2 = dateFormatter.format(msg2.timestamp);

    const expected = `[${timeStr1}] Alice: Hi\n[${timeStr2}] Bob: Hello Alice`;

    expect(formatMessages([msg1, msg2])).toBe(expected);
  });

  it('should handle messages with empty text', () => {
    const msg = createMockDbMessage({ text: '' });
    const timeStr = dateFormatter.format(msg.timestamp);
    const expected = `[${timeStr}] TestUser: `;

    expect(formatMessages([msg])).toBe(expected);
  });
});
