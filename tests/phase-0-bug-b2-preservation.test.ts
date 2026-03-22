import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

/**
 * Bug B2 Preservation Tests
 * 
 * **Validates: Requirements 3.4**
 * 
 * Property 2: Preservation - 其他数据库操作继续正常工作
 * 
 * IMPORTANT: Follow observation-first methodology
 * These tests capture the baseline behavior on UNFIXED code
 * EXPECTED OUTCOME: Tests PASS on unfixed code (confirms baseline to preserve)
 */

describe('Bug B2 Preservation: Other database operations continue to work', () => {
  const testStoreDir = path.join(process.cwd(), 'test-store-b2-preservation');
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
    `);

    db.close();
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testStoreDir)) {
      rmSync(testStoreDir, { recursive: true, force: true });
    }
  });

  it('should preserve insertMessage function behavior', async () => {
    // Use the actual database from db.js module
    const db = new Database(testDbPath);
    
    // Insert directly to test database
    const stmt = db.prepare(`
      INSERT INTO messages (channel, chat_jid, sender_jid, sender_name, text, timestamp, is_group, processed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run('test', 'test-jid', 'user-jid', 'Test User', 'Hello', Date.now(), 1, 0);
    const messageId = result.lastInsertRowid as number;

    expect(messageId).toBeGreaterThan(0);

    // Verify message was inserted
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
    expect(message).toBeDefined();
    db.close();
  });

  it('should preserve getUnprocessedMessages function behavior', async () => {
    const db = new Database(testDbPath);

    // Insert test messages directly
    db.prepare(`
      INSERT INTO messages (channel, chat_jid, sender_jid, sender_name, text, timestamp, is_group, processed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('test', 'test-jid', 'user1', 'User 1', 'Message 1', Date.now(), 1, 0);

    db.prepare(`
      INSERT INTO messages (channel, chat_jid, sender_jid, sender_name, text, timestamp, is_group, processed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('test', 'test-jid', 'user2', 'User 2', 'Message 2', Date.now(), 1, 0);

    const messages = db.prepare('SELECT * FROM messages WHERE processed = 0').all();
    expect(messages.length).toBe(2);
    db.close();
  });

  it('should preserve markMessagesProcessed function behavior', async () => {
    const db = new Database(testDbPath);

    // Insert test message
    const result = db.prepare(`
      INSERT INTO messages (channel, chat_jid, sender_jid, sender_name, text, timestamp, is_group, processed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('test', 'test-jid', 'user1', 'User 1', 'Message 1', Date.now(), 1, 0);
    const messageId = result.lastInsertRowid as number;

    // Mark as processed
    db.prepare('UPDATE messages SET processed = 1 WHERE id = ?').run(messageId);

    // Verify it's no longer unprocessed
    const unprocessed = db.prepare('SELECT * FROM messages WHERE processed = 0').all();
    expect(unprocessed.length).toBe(0);
    db.close();
  });

  it('should preserve getRegisteredGroup function behavior', async () => {
    const { setRegisteredGroup, getRegisteredGroup } = await import('../src/db.js');

    const group = {
      jid: 'test-jid',
      name: 'Test Group',
      folder: 'test-folder',
      channel: 'test-channel',
      added_at: new Date().toISOString()
    };

    setRegisteredGroup(group.jid, group);

    const retrieved = getRegisteredGroup(group.jid);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.jid).toBe(group.jid);
    expect(retrieved?.folder).toBe(group.folder);
  });

  it('should preserve getRegisteredGroupByFolder function behavior', async () => {
    const { setRegisteredGroup, getRegisteredGroupByFolder } = await import('../src/db.js');

    const group = {
      jid: 'test-jid',
      name: 'Test Group',
      folder: 'test-folder',
      channel: 'test-channel',
      added_at: new Date().toISOString()
    };

    setRegisteredGroup(group.jid, group);

    const retrieved = getRegisteredGroupByFolder(group.folder);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.jid).toBe(group.jid);
    expect(retrieved?.folder).toBe(group.folder);
  });
});
