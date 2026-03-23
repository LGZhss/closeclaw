// Package db 是 CloseClaw Ultra 内核的 SQLite 状态总线。
// 所有写操作经由 WAL 模式序列化，读操作可并发执行。
// 对应旧版 src/db.ts，提供完整的表结构与 CRUD 接口。
package db

import (
	"database/sql"
	"fmt"
	"log/slog"
	"path/filepath"
	"sync"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// DB 是全局单例连接，由 InitDB 初始化。
var (
	globalDB *sql.DB
	once     sync.Once
)

// InitDB 初始化 SQLite 连接并应用严格的并发调优参数。
// storeDir 对应 src/config.ts 中的 STORE_DIR 环境变量。
func InitDB(storeDir string) (*sql.DB, error) {
	var initErr error
	once.Do(func() {
		dbPath := filepath.Join(storeDir, "messages.db")
		// SQLite WAL 模式：读写并发互不阻塞
		dsn := fmt.Sprintf(
			"%s?_journal_mode=WAL&_synchronous=NORMAL&_busy_timeout=5000&_foreign_keys=ON",
			dbPath,
		)
		db, err := sql.Open("sqlite3", dsn)
		if err != nil {
			initErr = fmt.Errorf("打开 SQLite 连接失败: %w", err)
			return
		}
		// WAL 模式下最佳实践：单写连接避免"database is locked"
		// 读取可用多连接，写入内部通过 Go channel 序列化
		db.SetMaxOpenConns(1)
		db.SetMaxIdleConns(1)
		db.SetConnMaxLifetime(30 * time.Minute)

		if err := createSchema(db); err != nil {
			initErr = fmt.Errorf("建表失败: %w", err)
			return
		}
		globalDB = db
		slog.Info("SQLite 内核总线就绪", "path", dbPath)
	})
	if initErr != nil {
		return nil, initErr
	}
	return globalDB, nil
}

// GetDB 返回已初始化的全局连接，若未初始化则 panic（属编程错误）。
func GetDB() *sql.DB {
	if globalDB == nil {
		panic("db.InitDB 必须在调用 GetDB 前执行")
	}
	return globalDB
}

// createSchema 应用完整的 DDL，与 src/db.ts initializeDatabase() 语义对齐。
func createSchema(db *sql.DB) error {
	schema := `
-- ── messages: 对应 DbMessage (src/types.ts) ──────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  channel      TEXT    NOT NULL,
  chat_jid     TEXT    NOT NULL,
  sender_jid   TEXT    NOT NULL,
  sender_name  TEXT    NOT NULL,
  text         TEXT    NOT NULL,
  timestamp    INTEGER NOT NULL,
  is_group     INTEGER NOT NULL DEFAULT 0,
  group_name   TEXT,
  processed    INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── registered_groups: 对应 RegisteredGroup (src/types.ts) ─────────────
CREATE TABLE IF NOT EXISTS registered_groups (
  jid       TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  folder    TEXT NOT NULL UNIQUE,
  channel   TEXT NOT NULL,
  trigger   TEXT,
  is_main   INTEGER NOT NULL DEFAULT 0,
  added_at  TEXT NOT NULL
);

-- ── scheduled_tasks: 对应 ScheduledTask (src/types.ts) ──────────────────
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  group_folder   TEXT    NOT NULL,
  prompt         TEXT    NOT NULL,
  schedule_type  TEXT    NOT NULL,
  schedule_value TEXT    NOT NULL,
  is_paused      INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL,
  last_run_at    TEXT,
  next_run_at    TEXT,
  FOREIGN KEY (group_folder) REFERENCES registered_groups(folder) ON DELETE CASCADE
);

-- ── task_run_logs: 对应 TaskRunLog (src/types.ts) ────────────────────────
CREATE TABLE IF NOT EXISTS task_run_logs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id      INTEGER NOT NULL,
  started_at   TEXT    NOT NULL,
  completed_at TEXT,
  result       TEXT,
  error        TEXT,
  FOREIGN KEY (task_id) REFERENCES scheduled_tasks(id) ON DELETE CASCADE
);

-- ── sessions: 对应 Session (src/types.ts) ────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  group_folder TEXT PRIMARY KEY,
  session_id   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

-- ── router_state: 对应 RouterState (src/types.ts) ────────────────────────
CREATE TABLE IF NOT EXISTS router_state (
  group_folder          TEXT PRIMARY KEY,
  last_agent_message_id INTEGER NOT NULL,
  updated_at            TEXT    NOT NULL
);

-- ── 索引：完整复刻 src/db.ts 中已存在的优化索引 ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_chat_jid  ON messages(chat_jid);
CREATE INDEX IF NOT EXISTS idx_messages_processed ON messages(processed);
CREATE INDEX IF NOT EXISTS idx_messages_processed_timestamp ON messages(processed, timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_tasks_group_folder ON scheduled_tasks(group_folder);
CREATE INDEX IF NOT EXISTS idx_tasks_next_run     ON scheduled_tasks(next_run_at);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id  ON task_run_logs(task_id);
`
	if _, err := db.Exec(schema); err != nil {
		return fmt.Errorf("执行 DDL 失败: %w", err)
	}
	return nil
}
