import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TelegramChannel } from "../src/channels/telegram.js";
import { ChannelOpts } from "../src/types.js";

describe("Telegram Channel - Message Receiving", () => {
  let onMessageMock: any;

  beforeEach(() => { onMessageMock = vi.fn(); });
  afterEach(() => { vi.restoreAllMocks(); });

  function createPollingMock(firstUpdates: any[] = []) {
    let n = 0;
    return vi.fn().mockImplementation(async (url: string, opts: any) => {
      if (url.includes("getMe")) return { ok: true, json: async () => ({ ok: true, result: { id: 1, username: "bot" } }) };
      n++;
      if (n === 1) return { ok: true, json: async () => ({ ok: true, result: firstUpdates }) };
      return new Promise<any>((_r, rej) => {
        const s: AbortSignal | undefined = opts?.signal;
        if (s?.aborted) { const e = new Error("AbortError"); e.name = "AbortError"; return rej(e); }
        if (s) s.addEventListener("abort", () => { const e = new Error("AbortError"); e.name = "AbortError"; rej(e); });
      });
    });
  }

  it("should start Long Polling after connect", async () => {
    const mf = createPollingMock(); global.fetch = mf;
    const ch = new TelegramChannel({ onMessage: onMessageMock, registeredGroups: vi.fn() } as ChannelOpts, "tok");
    await ch.connect(); await new Promise(r => setTimeout(r, 30));
    expect(mf.mock.calls.find((c: any) => c[0].includes("getUpdates"))).toBeDefined();
    await ch.disconnect();
  });

  it("should call getUpdates with correct params", async () => {
    const mf = createPollingMock(); global.fetch = mf;
    const ch = new TelegramChannel({ onMessage: onMessageMock, registeredGroups: vi.fn() } as ChannelOpts, "tok");
    await ch.connect(); await new Promise(r => setTimeout(r, 30));
    const call = mf.mock.calls.find((c: any) => c[0].includes("getUpdates"));
    const body = JSON.parse(call[1].body);
    expect(body.timeout).toBe(30); expect(body.offset).toBeDefined();
    await ch.disconnect();
  });

  it("should call onMessage for private message", async () => {
    const upd = { update_id: 1001, message: { message_id: 5001, from: { id: 12345, first_name: "John", last_name: "Doe", username: "johndoe" }, chat: { id: 12345, type: "private" as const }, text: "Hello!", date: 1700000000 } };
    const mf = createPollingMock([upd]); global.fetch = mf;
    const ch = new TelegramChannel({ onMessage: onMessageMock, registeredGroups: vi.fn() } as ChannelOpts, "tok");
    await ch.connect(); await new Promise(r => setTimeout(r, 50));
    expect(onMessageMock).toHaveBeenCalledWith(expect.objectContaining({ id: "5001", channel: "telegram", chatJid: "telegram:12345", senderName: "John Doe (@johndoe)", text: "Hello!", isGroup: false }));
    await ch.disconnect();
  });

  it("should call onMessage with groupName for group", async () => {
    const upd = { update_id: 1002, message: { message_id: 5002, from: { id: 12345, first_name: "Alice" }, chat: { id: -100123, type: "supergroup" as const, title: "MyGroup" }, text: "Hi", date: 1700000100 } };
    const mf = createPollingMock([upd]); global.fetch = mf;
    const ch = new TelegramChannel({ onMessage: onMessageMock, registeredGroups: vi.fn() } as ChannelOpts, "tok");
    await ch.connect(); await new Promise(r => setTimeout(r, 50));
    expect(onMessageMock).toHaveBeenCalledWith(expect.objectContaining({ isGroup: true, groupName: "MyGroup" }));
    await ch.disconnect();
  });

  it("should update offset after processing", async () => {
    const updates = [
      { update_id: 1001, message: { message_id: 1, from: { id: 1, first_name: "A" }, chat: { id: 1, type: "private" as const }, text: "a", date: 1 } },
      { update_id: 1002, message: { message_id: 2, from: { id: 2, first_name: "B" }, chat: { id: 2, type: "private" as const }, text: "b", date: 2 } }
    ];
    const mf = createPollingMock(updates); global.fetch = mf;
    const ch = new TelegramChannel({ onMessage: onMessageMock, registeredGroups: vi.fn() } as ChannelOpts, "tok");
    await ch.connect(); await new Promise(r => setTimeout(r, 80));
    const calls = mf.mock.calls.filter((c: any) => c[0].includes("getUpdates"));
    if (calls.length > 1) expect(JSON.parse(calls[1][1].body).offset).toBe(1003);
    await ch.disconnect();
  });

  it("should retry polling after error", async () => {
    let resolveRetry!: () => void;
    const retryDetected = new Promise<void>(r => { resolveRetry = r; });
    let n = 0;
    const mf = vi.fn().mockImplementation(async (url: string, opts: any) => {
      if (url.includes("getMe")) return { ok: true, json: async () => ({ ok: true, result: { id: 1, username: "bot" } }) };
      n++;
      if (n === 1) throw new Error("Network error");
      resolveRetry();
      return new Promise<any>((_r, rej) => {
        const s: AbortSignal | undefined = opts?.signal;
        if (s?.aborted) { const e = new Error("AbortError"); e.name = "AbortError"; return rej(e); }
        if (s) s.addEventListener("abort", () => { const e = new Error("AbortError"); e.name = "AbortError"; rej(e); });
      });
    });
    global.fetch = mf;
    const ch = new TelegramChannel({ onMessage: onMessageMock, registeredGroups: vi.fn() } as ChannelOpts, "tok");
    await ch.connect();
    await Promise.race([retryDetected, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 7000))]);
    expect(mf.mock.calls.filter((c: any) => c[0].includes("getUpdates")).length).toBeGreaterThanOrEqual(2);
    await ch.disconnect();
  }, 10000);
});
