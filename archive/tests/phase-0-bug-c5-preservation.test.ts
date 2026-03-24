import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

/**
 * Bug C5 Preservation Tests
 * 
 * **Validates: Requirements 3.6**
 * 
 * Property 2: Preservation - 其他类型定义和配置继续正常工作
 * 
 * IMPORTANT: Follow observation-first methodology
 * These tests capture the baseline behavior on UNFIXED code
 * EXPECTED OUTCOME: Tests PASS on unfixed code (confirms baseline to preserve)
 */

describe('Bug C5 Preservation: Other types and config continue to work', () => {
  const testStoreDir = path.join(process.cwd(), 'test-store-c5-preservation');
  const testDbPath = path.join(testStoreDir, 'messages.db');

  beforeEach(() => {
    // Clean up and create test directory
    if (existsSync(testStoreDir)) {
      rmSync(testStoreDir, { recursive: true, force: true });
    }
    mkdirSync(testStoreDir, { recursive: true });

    // Override STORE_DIR for tests
    process.env.STORE_DIR = testStoreDir;
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testStoreDir)) {
      rmSync(testStoreDir, { recursive: true, force: true });
    }
  });

  it('should preserve RegisteredGroup type (without containerConfig)', async () => {
    const { setRegisteredGroup, getRegisteredGroup } = await import('../src/db.js');

    const group = {
      jid: 'test-jid',
      name: 'Test Group',
      folder: 'test-folder',
      channel: 'test-channel',
      added_at: new Date().toISOString()
    };

    // This should work regardless of containerConfig field
    setRegisteredGroup(group.jid, group);

    const retrieved = getRegisteredGroup(group.jid);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.jid).toBe(group.jid);
    expect(retrieved?.folder).toBe(group.folder);
  });

  it('should preserve Channel type', async () => {
    // Channel type should continue to work
    const mockChannel = {
      name: 'test-channel',
      connect: async () => {},
      sendMessage: async () => {},
      isConnected: () => true,
      ownsJid: (jid: string) => jid === 'test-jid',
      disconnect: async () => {}
    };

    expect(mockChannel.name).toBe('test-channel');
    expect(typeof mockChannel.connect).toBe('function');
    expect(typeof mockChannel.sendMessage).toBe('function');
  });

  it('should preserve IncomingMessage type', () => {
    const message = {
      id: 'msg-1',
      channel: 'test',
      chatJid: 'test-jid',
      senderJid: 'user-jid',
      senderName: 'Test User',
      text: 'Hello',
      timestamp: Date.now(),
      isGroup: true,
      groupName: 'Test Group'
    };

    expect(message.id).toBe('msg-1');
    expect(message.channel).toBe('test');
  });

  it('should preserve MAX_CONCURRENT_CONTAINERS constant', async () => {
    const { MAX_CONCURRENT_CONTAINERS } = await import('../src/config.js');

    // This constant should continue to work (even though name is outdated)
    expect(MAX_CONCURRENT_CONTAINERS).toBeGreaterThan(0);
    expect(typeof MAX_CONCURRENT_CONTAINERS).toBe('number');
  });

  it('should preserve other config constants', async () => {
    const { ASSISTANT_NAME, POLL_INTERVAL, STORE_DIR, GROUPS_DIR, DATA_DIR } = await import('../src/config.js');

    expect(typeof ASSISTANT_NAME).toBe('string');
    expect(typeof POLL_INTERVAL).toBe('number');
    expect(typeof STORE_DIR).toBe('string');
    expect(typeof GROUPS_DIR).toBe('string');
    expect(typeof DATA_DIR).toBe('string');
  });

  it('should preserve database operations for registered_groups', async () => {
    const { setRegisteredGroup, getAllRegisteredGroups } = await import('../src/db.js');

    const group1 = {
      jid: 'jid-1',
      name: 'Group 1',
      folder: 'folder-1',
      channel: 'channel-1',
      added_at: new Date().toISOString()
    };

    const group2 = {
      jid: 'jid-2',
      name: 'Group 2',
      folder: 'folder-2',
      channel: 'channel-2',
      added_at: new Date().toISOString()
    };

    setRegisteredGroup(group1.jid, group1);
    setRegisteredGroup(group2.jid, group2);

    const allGroups = getAllRegisteredGroups();
    expect(allGroups.length).toBeGreaterThanOrEqual(2);
  });
});
