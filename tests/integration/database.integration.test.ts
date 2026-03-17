/**
 * tests/integration/database.integration.test.ts
 * 数据库层集成测试（提案 015）
 * 测试 SQLite 的连接、事务、并发插入及边界条件
 * 实施主体: Verdent (Claude Sonnet 4.6)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Database as DB } from 'better-sqlite3';
import { createTestDb, cleanTestDb, closeTestDb } from '../utils/test-database.js';
import { makeMessage, makeGroup, makeTask, resetFactoryCounters } from '../utils/mock-factories.js';

let db: DB;

beforeEach(() => {
  db = createTestDb();
  resetFactoryCounters();
});

afterEach(() => {
  closeTestDb(db);
});

// ── 消息表 ────────────────────────────────────────
describe('messages 表', () => {
  it('应能插入并查询一条消息', () => {
    const msg = makeMessage({ text: '集成测试消息' });
    db.prepare(`
      INSERT INTO messages (channel, chat_jid, sender_jid, sender_name, text, timestamp, is_group)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(msg.channel, msg.chat_jid, msg.sender_jid, msg.sender_name, msg.text, msg.timestamp, msg.is_group);

    const row = db.prepare('SELECT * FROM messages WHERE text = ?').get(msg.text) as typeof msg;
    expect(row).toBeDefined();
    expect(row.text).toBe('集成测试消息');
    expect(row.processed).toBe(0);
  });

  it('应能批量插入 100 条消息并正确计数', () => {
    const insert = db.prepare(`
      INSERT INTO messages (channel, chat_jid, sender_jid, sender_name, text, timestamp, is_group)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((msgs: ReturnType<typeof makeMessage>[]) => {
      for (const m of msgs) {
        insert.run(m.channel, m.chat_jid, m.sender_jid, m.sender_name, m.text, m.timestamp, m.is_group);
      }
    });

    const messages = Array.from({ length: 100 }, (_, i) => makeMessage({ text: `消息 ${i}` }));
    insertMany(messages);

    const { count } = db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number };
    expect(count).toBe(100);
  });

  it('应能将消息标记为已处理', () => {
    const msg = makeMessage();
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO messages (channel, chat_jid, sender_jid, sender_name, text, timestamp, is_group)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(msg.channel, msg.chat_jid, msg.sender_jid, msg.sender_name, msg.text, msg.timestamp, msg.is_group);

    db.prepare('UPDATE messages SET processed = 1 WHERE id = ?').run(lastInsertRowid);

    const row = db.prepare('SELECT processed FROM messages WHERE id = ?').get(lastInsertRowid) as { processed: number };
    expect(row.processed).toBe(1);
  });

  it('查询未处理消息应只返回 processed=0 的行', () => {
    const insert = db.prepare(`
      INSERT INTO messages (channel, chat_jid, sender_jid, sender_name, text, timestamp, is_group, processed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run('ch', 'jid', 's', 'u', '未处理', Date.now(), 0, 0);
    insert.run('ch', 'jid', 's', 'u', '已处理', Date.now(), 0, 1);

    const rows = db.prepare('SELECT * FROM messages WHERE processed = 0').all();
    expect(rows).toHaveLength(1);
    expect((rows[0] as { text: string }).text).toBe('未处理');
  });
});

// ── 群组注册表 ─────────────────────────────────────
describe('registered_groups 表', () => {
  it('应能注册群组并读取', () => {
    const g = makeGroup({ jid: 'unique-jid@g.us', folder: 'unique-folder' });
    db.prepare(`
      INSERT INTO registered_groups (jid, name, folder, channel) VALUES (?, ?, ?, ?)
    `).run(g.jid, g.name, g.folder, g.channel);

    const row = db.prepare('SELECT * FROM registered_groups WHERE jid = ?').get(g.jid) as typeof g;
    expect(row.name).toBe(g.name);
    expect(row.channel).toBe(g.channel);
  });

  it('folder 字段有唯一约束，重复插入应抛出错误', () => {
    const g = makeGroup({ jid: 'jid-a@g.us', folder: 'same-folder' });
    db.prepare(`INSERT INTO registered_groups (jid, name, folder, channel) VALUES (?, ?, ?, ?)`).run(g.jid, g.name, g.folder, g.channel);

    expect(() => {
      db.prepare(`INSERT INTO registered_groups (jid, name, folder, channel) VALUES (?, ?, ?, ?)`).run('jid-b@g.us', 'other', 'same-folder', 'ch');
    }).toThrow();
  });
});

// ── 定时任务表 ─────────────────────────────────────
describe('scheduled_tasks 表', () => {
  it('应能插入定时任务并按 next_run 排序查询', () => {
    const now = Date.now();
    const tasks = [
      makeTask({ id: 'task-a', next_run: now + 10000 }),
      makeTask({ id: 'task-b', next_run: now + 1000 }),
      makeTask({ id: 'task-c', next_run: now + 5000 }),
    ];

    const insert = db.prepare(`
      INSERT INTO scheduled_tasks (id, name, cron_expression, interval_ms, next_run, last_run, is_active, task_type, payload)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const t of tasks) {
      insert.run(t.id, t.name, t.cron_expression, t.interval_ms, t.next_run, t.last_run, t.is_active, t.task_type, t.payload);
    }

    const ordered = db.prepare('SELECT id FROM scheduled_tasks ORDER BY next_run ASC').all() as { id: string }[];
    expect(ordered.map((r) => r.id)).toEqual(['task-b', 'task-c', 'task-a']);
  });
});

// ── 事务回滚 ──────────────────────────────────────
describe('事务完整性', () => {
  it('事务内发生错误时应完整回滚', () => {
    const insert = db.prepare(`
      INSERT INTO messages (channel, chat_jid, sender_jid, sender_name, text, timestamp, is_group)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const failingTx = db.transaction(() => {
      insert.run('ch', 'jid', 's', 'u', '消息1', Date.now(), 0);
      throw new Error('模拟中途失败');
    });

    expect(() => failingTx()).toThrow('模拟中途失败');

    const { count } = db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number };
    expect(count).toBe(0);
  });
});
