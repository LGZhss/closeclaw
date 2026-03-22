import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

/**
 * Bug B1 Preservation Tests
 * 
 * **Validates: Requirements 3.3**
 * 
 * Property 2: Preservation - 其他已正确导入的函数继续正常工作
 * 
 * IMPORTANT: Follow observation-first methodology
 * These tests capture the baseline behavior on UNFIXED code
 * EXPECTED OUTCOME: Tests PASS on unfixed code (confirms baseline to preserve)
 */

describe('Bug B1 Preservation: Other router.ts imports continue to work', () => {
  const testStoreDir = path.join(process.cwd(), 'test-store-b1-preservation');
  const testDbPath = path.join(testStoreDir, 'messages.db');

  beforeEach(() => {
    // Clean up and create test directory
    if (existsSync(testStoreDir)) {
      rmSync(testStoreDir, { recursive: true, force: true });
    }
    mkdirSync(testStoreDir, { recursive: true });

    // Override STORE_DIR for tests
    process.env.STORE_DIR = testStoreDir;

    // Set up test database
    const db = new Database(testDbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS registered_groups (
        jid TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        folder TEXT NOT NULL UNIQUE,
        channel TEXT NOT NULL,
        trigger TEXT,
        is_main INTEGER NOT NULL DEFAULT 0,
        added_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel TEXT NOT NULL,
        chat_jid TEXT NOT NULL,
        sender_jid TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        is_group INTEGER NOT NULL DEFAULT 0,
        group_name TEXT,
        processed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS router_state (
        group_folder TEXT PRIMARY KEY,
        last_agent_message_id INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Insert test data
    db.prepare(`
      INSERT INTO registered_groups (jid, name, folder, channel, is_main, added_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('test-jid', 'Test Group', 'test-group', 'test-channel', 0, new Date().toISOString());

    db.close();
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testStoreDir)) {
      rmSync(testStoreDir, { recursive: true, force: true });
    }
  });

  it('should preserve formatMessages function behavior', async () => {
    const { formatMessages } = await import('../src/router.js');

    const messages = [
      {
        id: 1,
        channel: 'test',
        chat_jid: 'test-jid',
        sender_jid: 'user1',
        sender_name: 'User One',
        text: 'Hello',
        timestamp: Date.now(),
        is_group: true,
        processed: false,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        channel: 'test',
        chat_jid: 'test-jid',
        sender_jid: 'user2',
        sender_name: 'User Two',
        text: 'World',
        timestamp: Date.now(),
        is_group: true,
        processed: false,
        created_at: new Date().toISOString()
      }
    ];

    const formatted = formatMessages(messages);
    
    // Verify format includes sender names and text
    expect(formatted).toContain('User One');
    expect(formatted).toContain('Hello');
    expect(formatted).toContain('User Two');
    expect(formatted).toContain('World');
  });

  it('should preserve shouldTrigger function behavior', async () => {
    const { shouldTrigger } = await import('../src/router.js');

    const triggeringMessage = {
      id: 1,
      channel: 'test',
      chat_jid: 'test-jid',
      sender_jid: 'user1',
      sender_name: 'User',
      text: '@Andy help me',
      timestamp: Date.now(),
      is_group: true,
      processed: false,
      created_at: new Date().toISOString()
    };

    const nonTriggeringMessage = {
      ...triggeringMessage,
      text: 'Just a normal message'
    };

    expect(shouldTrigger(triggeringMessage)).toBe(true);
    expect(shouldTrigger(nonTriggeringMessage)).toBe(false);
  });

  it('should preserve findChannelForJid function behavior', async () => {
    const { findChannelForJid } = await import('../src/router.js');

    const mockChannel = {
      name: 'test-channel',
      connect: async () => {},
      sendMessage: async () => {},
      isConnected: () => true,
      ownsJid: (jid: string) => jid === 'test-jid',
      disconnect: async () => {}
    };

    const result = findChannelForJid('test-jid', [mockChannel]);
    expect(result).toBe(mockChannel);

    const noResult = findChannelForJid('other-jid', [mockChannel]);
    expect(noResult).toBeNull();
  });

  it('should preserve formatResponse function behavior', async () => {
    const { formatResponse } = await import('../src/router.js');

    const response = formatResponse('Hello, how can I help?');
    expect(response).toBe('Andy: Hello, how can I help?');
  });

  it('should preserve escapeXml function behavior', async () => {
    const { escapeXml } = await import('../src/router.js');

    expect(escapeXml('<test>')).toBe('&lt;test&gt;');
    expect(escapeXml('a & b')).toBe('a &amp; b');
    expect(escapeXml('"quoted"')).toBe('&quot;quoted&quot;');
  });
});
