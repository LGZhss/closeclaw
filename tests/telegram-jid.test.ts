import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TelegramChannel } from "../src/channels/telegram.js";
import { ChannelOpts } from "../src/types.js";

describe("Telegram Channel - JID Management", () => {
  let channel: TelegramChannel;

  beforeEach(() => {
    channel = new TelegramChannel({ onMessage: vi.fn(), registeredGroups: vi.fn() } as ChannelOpts, "test-token");
  });

  afterEach(() => { vi.restoreAllMocks(); });

  describe("ownsJid", () => {
    it("should return true for telegram JID", () => { expect(channel.ownsJid("telegram:12345")).toBe(true); });
    it("should return false for whatsapp JID", () => { expect(channel.ownsJid("whatsapp:12345")).toBe(false); });
    it("should return false for slack JID", () => { expect(channel.ownsJid("slack:C12345")).toBe(false); });
    it("should return false for discord JID", () => { expect(channel.ownsJid("discord:12345")).toBe(false); });
    it("should return false for invalid JID", () => { expect(channel.ownsJid("invalid-jid")).toBe(false); });
    it("should return false for empty string", () => { expect(channel.ownsJid("")).toBe(false); });
  });

  describe("extractChatId via sendMessage", () => {
    it("should extract positive chat ID", async () => {
      const mf = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, result: { message_id: 1 } }) });
      global.fetch = mf;
      await channel.sendMessage("telegram:12345", "Test");
      expect(JSON.parse(mf.mock.calls[0][1].body).chat_id).toBe(12345);
    });

    it("should extract negative chat ID (group)", async () => {
      const mf = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, result: { message_id: 1 } }) });
      global.fetch = mf;
      await channel.sendMessage("telegram:-100123456789", "Test");
      expect(JSON.parse(mf.mock.calls[0][1].body).chat_id).toBe(-100123456789);
    });

    it("should throw error for invalid JID format", async () => {
      await expect(channel.sendMessage("invalid-jid", "Test")).rejects.toThrow("Invalid Telegram JID");
    });

    it("should throw error for JID without chat ID", async () => {
      await expect(channel.sendMessage("telegram:", "Test")).rejects.toThrow("Invalid Telegram JID");
    });

    it("should throw error for JID with non-numeric chat ID", async () => {
      await expect(channel.sendMessage("telegram:abc", "Test")).rejects.toThrow("Invalid Telegram JID");
    });
  });

  describe("formatUserName", () => {
    function createPollingMock(update: any) {
      let n = 0;
      return vi.fn().mockImplementation(async (url: string, opts: any) => {
        if (url.includes("getMe")) return { ok: true, json: async () => ({ ok: true, result: { id: 1, username: "bot" } }) };
        n++;
        if (n === 1) return { ok: true, json: async () => ({ ok: true, result: [update] }) };
        return new Promise<any>((_r, rej) => {
          const s: AbortSignal | undefined = opts?.signal;
          if (s?.aborted) { const e = new Error("AbortError"); e.name = "AbortError"; return rej(e); }
          if (s) s.addEventListener("abort", () => { const e = new Error("AbortError"); e.name = "AbortError"; rej(e); });
        });
      });
    }

    it("should format user with first name only", async () => {
      const onMsg = vi.fn();
      const mf = createPollingMock({ update_id: 1, message: { message_id: 1, from: { id: 1, first_name: "Alice" }, chat: { id: 1, type: "private" as const }, text: "Hi", date: 1 } });
      global.fetch = mf;
      const ch = new TelegramChannel({ onMessage: onMsg, registeredGroups: vi.fn() } as ChannelOpts, "tok");
      await ch.connect();
      await new Promise(r => setTimeout(r, 50));
      expect(onMsg).toHaveBeenCalledWith(expect.objectContaining({ senderName: "Alice" }));
      await ch.disconnect();
    });

    it("should format user with first and last name", async () => {
      const onMsg = vi.fn();
      const mf = createPollingMock({ update_id: 1, message: { message_id: 1, from: { id: 1, first_name: "John", last_name: "Doe" }, chat: { id: 1, type: "private" as const }, text: "Hi", date: 1 } });
      global.fetch = mf;
      const ch = new TelegramChannel({ onMessage: onMsg, registeredGroups: vi.fn() } as ChannelOpts, "tok");
      await ch.connect();
      await new Promise(r => setTimeout(r, 50));
      expect(onMsg).toHaveBeenCalledWith(expect.objectContaining({ senderName: "John Doe" }));
      await ch.disconnect();
    });

    it("should format user with full name and username", async () => {
      const onMsg = vi.fn();
      const mf = createPollingMock({ update_id: 1, message: { message_id: 1, from: { id: 1, first_name: "Bob", last_name: "Smith", username: "bobsmith" }, chat: { id: 1, type: "private" as const }, text: "Hi", date: 1 } });
      global.fetch = mf;
      const ch = new TelegramChannel({ onMessage: onMsg, registeredGroups: vi.fn() } as ChannelOpts, "tok");
      await ch.connect();
      await new Promise(r => setTimeout(r, 50));
      expect(onMsg).toHaveBeenCalledWith(expect.objectContaining({ senderName: "Bob Smith (@bobsmith)" }));
      await ch.disconnect();
    });
  });
});
