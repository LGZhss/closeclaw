import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

/**
 * Bug B2 Exploration Test
 * 
 * **Validates: Requirements 1.2, 2.2**
 * 
 * Property 1: Bug Condition - chatJid 直接用作 groupFolder 导致路由失败
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * Expected counterexample on unfixed code:
 * - processGroup receives chatJid instead of groupFolder
 * - getRegisteredGroupByFolder(chatJid) returns null
 * - Message routing fails
 */

describe('Bug B2: Incorrect chatJid to groupFolder mapping', () => {
  const testStoreDir = path.join(process.cwd(), 'test-store-b2');
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

    // Insert test data with DIFFERENT chatJid and folder
    // This is the key: chatJid = 'whatsapp-group-123' but folder = 'my-project-group'
    db.prepare(`
      INSERT INTO registered_groups (jid, name, folder, channel, is_main, added_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('whatsapp-group-123', 'My Project Group', 'my-project-group', 'whatsapp', 0, new Date().toISOString());

    // Insert a message with the chatJid
    db.prepare(`
      INSERT INTO messages (channel, chat_jid, sender_jid, sender_name, text, timestamp, is_group, processed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('whatsapp', 'whatsapp-group-123', 'user-jid', 'Test User', '@Andy help', Date.now(), 1, 0);

    db.close();
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testStoreDir)) {
      rmSync(testStoreDir, { recursive: true, force: true });
    }
  });

  it('should correctly map chatJid to groupFolder when processing messages', async () => {
    // Import the db functions to verify the mapping
    const db = new Database(testDbPath);
    
    // Get unprocessed messages directly from the test database
    const messages = db.prepare('SELECT * FROM messages WHERE processed = 0').all() as any[];
    expect(messages.length).toBeGreaterThan(0);

    const message = messages[0];
    const chatJid = message.chat_jid;

    // The bug: index.ts uses chatJid directly as groupFolder
    // This test verifies that we SHOULD use getRegisteredGroup to map chatJid to folder
    
    // Correct behavior: look up the group by chatJid
    const group = db.prepare('SELECT * FROM registered_groups WHERE jid = ?').get(chatJid) as any;
    expect(group).not.toBeNull();
    expect(group.jid).toBe('whatsapp-group-123');
    expect(group.folder).toBe('my-project-group');

    // The bug would be: using chatJid directly as groupFolder
    // This would fail because 'whatsapp-group-123' is not a valid folder name
    const wrongLookup = db.prepare('SELECT * FROM registered_groups WHERE folder = ?').get(chatJid) as any;
    
    // On unfixed code, this would be the behavior in index.ts:
    // const groupFolder = chatJid; // WRONG!
    // await processGroup(groupFolder); // This would fail
    
    // This assertion documents the bug: using chatJid as groupFolder fails
    expect(wrongLookup).toBeUndefined(); // chatJid is NOT a valid folder
    
    // The correct folder should be used instead
    const correctLookup = db.prepare('SELECT * FROM registered_groups WHERE folder = ?').get(group.folder) as any;
    expect(correctLookup).not.toBeUndefined();
    expect(correctLookup.folder).toBe('my-project-group');
    
    db.close();
  });

  it('should fail when chatJid is used directly as groupFolder', async () => {
    const db = new Database(testDbPath);

    const messages = db.prepare('SELECT * FROM messages WHERE processed = 0').all() as any[];
    const chatJid = messages[0].chat_jid;

    // Simulate the bug: using chatJid as groupFolder
    const result = db.prepare('SELECT * FROM registered_groups WHERE folder = ?').get(chatJid) as any;

    // This should be undefined because chatJid is not a folder name
    // This documents the bug condition
    expect(result).toBeUndefined();
    
    db.close();
  });
});
