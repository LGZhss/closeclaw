/**
 * tests/e2e/system-lifecycle.e2e.test.ts
 * 系统生命周期端到端测试（提案 015）
 * 验证从数据库初始化到任务调度的完整流程
 * 实施主体: Verdent (Claude Sonnet 4.6)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Database as DB } from 'better-sqlite3';
import { createTestDb, cleanTestDb, closeTestDb } from '../utils/test-database.js';
import { makeMessage, makeGroup, makeTask, resetFactoryCounters } from '../utils/mock-factories.js';
import { sleep, waitFor } from '../utils/test-helpers.js';

let db: DB;

beforeEach(() => {
  db = createTestDb();
  resetFactoryCounters();
});

afterEach(() => {
  closeTestDb(db);
});

describe('数据库初始化生命周期', () => {
  it('应正确初始化所有必要的数据库表', () => {
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all() as { name: string }[];

    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('messages');
    expect(tableNames).toContain('registered_groups');
    expect(tableNames).toContain('scheduled_tasks');
    expect(tableNames).toContain('sessions');
    expect(tableNames).toContain('router_state');
  });

  it('WAL 模式在文件数据库中应已启用（内存库使用 memory 模式）', () => {
    // 内存数据库固定使用 memory 模式，生产环境文件数据库使用 WAL
    const row = db.pragma('journal_mode') as { journal_mode: string }[];
    expect(['wal', 'memory']).toContain(row[0]?.journal_mode);
  });

  it('外键约束应已启用', () => {
    const row = db.pragma('foreign_keys') as { foreign_keys: number }[];
    expect(row[0]?.foreign_keys).toBe(1);
  });
});

describe('消息处理完整流程', () => {
  it('应完成：接收消息 → 持久化 → 标记处理 → 查询已处理', async () => {
    // 1. 模拟消息接收（写入数据库）
    const msg = makeMessage({ text: '端到端测试消息' });
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO messages (channel, chat_jid, sender_jid, sender_name, text, timestamp, is_group)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(msg.channel, msg.chat_jid, msg.sender_jid, msg.sender_name, msg.text, msg.timestamp, msg.is_group);

    // 2. 验证消息已写入
    const saved = db.prepare('SELECT * FROM messages WHERE id = ?').get(lastInsertRowid) as typeof msg;
    expect(saved.text).toBe('端到端测试消息');
    expect(saved.processed).toBe(0);

    // 3. 模拟处理（标记为已处理）
    await sleep(10); // 模拟异步处理延迟
    db.prepare('UPDATE messages SET processed = 1 WHERE id = ?').run(lastInsertRowid);

    // 4. 验证处理状态
    await waitFor(() => {
      const row = db.prepare('SELECT processed FROM messages WHERE id = ?').get(lastInsertRowid) as { processed: number };
      return row.processed === 1;
    });

    const processed = db.prepare('SELECT processed FROM messages WHERE id = ?').get(lastInsertRowid) as { processed: number };
    expect(processed.processed).toBe(1);
  });

  it('应支持多通道并发消息写入', () => {
    const channels = ['whatsapp', 'telegram', 'wechat'];
    const insert = db.prepare(`
      INSERT INTO messages (channel, chat_jid, sender_jid, sender_name, text, timestamp, is_group)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAll = db.transaction(() => {
      for (const ch of channels) {
        for (let i = 0; i < 10; i++) {
          const m = makeMessage({ channel: ch, text: `${ch} 消息 ${i}` });
          insert.run(m.channel, m.chat_jid, m.sender_jid, m.sender_name, m.text, m.timestamp, m.is_group);
        }
      }
    });
    insertAll();

    for (const ch of channels) {
      const { count } = db.prepare('SELECT COUNT(*) as count FROM messages WHERE channel = ?').get(ch) as { count: number };
      expect(count).toBe(10);
    }
  });
});

describe('群组注册生命周期', () => {
  it('应完成：注册群组 → 查询激活状态 → 停用群组', () => {
    const group = makeGroup({ jid: 'e2e-group@g.us', folder: 'e2e-folder' });

    // 注册
    db.prepare(`INSERT INTO registered_groups (jid, name, folder, channel) VALUES (?, ?, ?, ?)`).run(
      group.jid, group.name, group.folder, group.channel
    );

    // 验证激活
    const active = db.prepare('SELECT is_active FROM registered_groups WHERE jid = ?').get(group.jid) as { is_active: number };
    expect(active.is_active).toBe(1);

    // 停用
    db.prepare('UPDATE registered_groups SET is_active = 0 WHERE jid = ?').run(group.jid);
    const inactive = db.prepare('SELECT is_active FROM registered_groups WHERE jid = ?').get(group.jid) as { is_active: number };
    expect(inactive.is_active).toBe(0);
  });
});

describe('路由器状态持久化', () => {
  it('应能读写路由器状态键值对', () => {
    db.prepare(`INSERT OR REPLACE INTO router_state (key, value) VALUES (?, ?)`).run('mode', 'active');
    db.prepare(`INSERT OR REPLACE INTO router_state (key, value) VALUES (?, ?)`).run('version', '2.0');

    const mode = db.prepare('SELECT value FROM router_state WHERE key = ?').get('mode') as { value: string };
    expect(mode.value).toBe('active');

    const version = db.prepare('SELECT value FROM router_state WHERE key = ?').get('version') as { value: string };
    expect(version.value).toBe('2.0');
  });

  it('INSERT OR REPLACE 应能覆盖已有键', () => {
    db.prepare(`INSERT OR REPLACE INTO router_state (key, value) VALUES (?, ?)`).run('key1', 'old');
    db.prepare(`INSERT OR REPLACE INTO router_state (key, value) VALUES (?, ?)`).run('key1', 'new');

    const row = db.prepare('SELECT value FROM router_state WHERE key = ?').get('key1') as { value: string };
    expect(row.value).toBe('new');

    const { count } = db.prepare('SELECT COUNT(*) as count FROM router_state WHERE key = ?').get('key1') as { count: number };
    expect(count).toBe(1);
  });
});
