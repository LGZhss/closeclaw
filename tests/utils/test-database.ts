/**
 * tests/utils/test-database.ts
 * 测试数据库管理工具（提案 015）
 * 提供内存数据库的初始化与清理，避免测试间状态污染
 * 实施主体: Verdent (Claude Sonnet 4.6)
 */

import Database from 'better-sqlite3';
import type { Database as DB } from 'better-sqlite3';

/** 创建一个全新的内存数据库，初始化与生产环境一致的 Schema */
export function createTestDb(): DB {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
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

    CREATE TABLE IF NOT EXISTS registered_groups (
      jid TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      folder TEXT NOT NULL UNIQUE,
      channel TEXT NOT NULL,
      registered_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS scheduled_tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cron_expression TEXT,
      interval_ms INTEGER,
      next_run INTEGER,
      last_run INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      task_type TEXT NOT NULL DEFAULT 'recurring',
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      chat_jid TEXT NOT NULL,
      agent_session_id TEXT,
      context TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS router_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

/** 清理测试数据库中的所有数据（保留 Schema） */
export function cleanTestDb(db: DB): void {
  db.exec(`
    DELETE FROM messages;
    DELETE FROM registered_groups;
    DELETE FROM scheduled_tasks;
    DELETE FROM sessions;
    DELETE FROM router_state;
  `);
}

/** 关闭测试数据库 */
export function closeTestDb(db: DB): void {
  db.close();
}
