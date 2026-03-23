// Package db — 消息 CRUD 层，对应旧版 src/db.ts 中的 insertMessage / getUnprocessedMessages 等操作。
// 所有写操作通过单一 sql.DB 连接序列化（SetMaxOpenConns(1)）。
package db

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

// ─────────────────────────────────────────
// 数据模型（与 src/types.ts 字段保持语义对齐）
// ─────────────────────────────────────────

// DbMessage 对应 messages 表一行。
type DbMessage struct {
	ID          int64  `json:"id"`
	Channel     string `json:"channel"`
	ChatJID     string `json:"chat_jid"`
	SenderJID   string `json:"sender_jid"`
	SenderName  string `json:"sender_name"`
	Text        string `json:"text"`
	Timestamp   int64  `json:"timestamp"`
	IsGroup     bool   `json:"is_group"`
	GroupName   string `json:"group_name"`
	Processed   bool   `json:"processed"`
	CreatedAt   string `json:"created_at"`
}

// RegisteredGroup 对应 registered_groups 表一行。
type RegisteredGroup struct {
	JID     string `json:"jid"`
	Name    string `json:"name"`
	Folder  string `json:"folder"`
	Channel string `json:"channel"`
	Trigger string `json:"trigger"`
	IsMain  bool   `json:"is_main"`
	AddedAt string `json:"added_at"`
}

// ScheduledTask 对应 scheduled_tasks 表一行。
type ScheduledTask struct {
	ID            int64  `json:"id"`
	GroupFolder   string `json:"group_folder"`
	Prompt        string `json:"prompt"`
	ScheduleType  string `json:"schedule_type"`
	ScheduleValue string `json:"schedule_value"`
	IsPaused      bool   `json:"is_paused"`
	CreatedAt     string `json:"created_at"`
	LastRunAt     string `json:"last_run_at"`
	NextRunAt     string `json:"next_run_at"`
}

// ─────────────────────────────────────────
// 消息操作
// ─────────────────────────────────────────

// InsertMessage 写入一条新消息，返回自增行 ID。
func InsertMessage(db *sql.DB, msg DbMessage) (int64, error) {
	res, err := db.Exec(
		`INSERT INTO messages (channel, chat_jid, sender_jid, sender_name, text, timestamp, is_group, group_name, processed)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		msg.Channel, msg.ChatJID, msg.SenderJID, msg.SenderName,
		msg.Text, msg.Timestamp, boolInt(msg.IsGroup), nullStr(msg.GroupName), boolInt(msg.Processed),
	)
	if err != nil {
		return 0, fmt.Errorf("InsertMessage: %w", err)
	}
	return res.LastInsertId()
}

// GetUnprocessedMessages 返回未处理消息，按 timestamp ASC 排序。
func GetUnprocessedMessages(db *sql.DB, limit int) ([]DbMessage, error) {
	rows, err := db.Query(
		`SELECT id, channel, chat_jid, sender_jid, sender_name, text, timestamp,
		        is_group, COALESCE(group_name,''), processed, created_at
		 FROM messages WHERE processed = 0 ORDER BY timestamp ASC LIMIT ?`, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("GetUnprocessedMessages: %w", err)
	}
	defer rows.Close()
	return scanMessages(rows)
}

// MarkMessagesProcessed 批量标记消息为已处理，使用 json_each 避免动态拼接 IN 语句。
func MarkMessagesProcessed(db *sql.DB, ids []int64) error {
	if len(ids) == 0 {
		return nil
	}
	jsonIDs, _ := json.Marshal(ids)
	_, err := db.Exec(
		`UPDATE messages SET processed = 1 WHERE id IN (SELECT value FROM json_each(?))`,
		string(jsonIDs),
	)
	return err
}

// ─────────────────────────────────────────
// 调度任务操作
// ─────────────────────────────────────────

// InsertTask 写入新调度任务，返回行 ID。
func InsertTask(db *sql.DB, t ScheduledTask) (int64, error) {
	res, err := db.Exec(
		`INSERT INTO scheduled_tasks (group_folder, prompt, schedule_type, schedule_value, is_paused, created_at, next_run_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		t.GroupFolder, t.Prompt, t.ScheduleType, t.ScheduleValue,
		boolInt(t.IsPaused), t.CreatedAt, nullStr(t.NextRunAt),
	)
	if err != nil {
		return 0, fmt.Errorf("InsertTask: %w", err)
	}
	return res.LastInsertId()
}

// GetDueTasks 返回当前应触发的任务（非暂停且 next_run_at <= now）。
func GetDueTasks(db *sql.DB, now time.Time) ([]ScheduledTask, error) {
	rows, err := db.Query(
		`SELECT id, group_folder, prompt, schedule_type, schedule_value, is_paused,
		        created_at, COALESCE(last_run_at,''), COALESCE(next_run_at,'')
		 FROM scheduled_tasks WHERE is_paused = 0 AND next_run_at IS NOT NULL AND next_run_at <= ?
		 ORDER BY next_run_at ASC`,
		now.UTC().Format(time.RFC3339),
	)
	if err != nil {
		return nil, fmt.Errorf("GetDueTasks: %w", err)
	}
	defer rows.Close()
	return scanTasks(rows)
}

// UpdateTaskNextRun 更新 last_run_at 与 next_run_at。
func UpdateTaskNextRun(db *sql.DB, taskID int64, nextRunAt string) error {
	_, err := db.Exec(
		`UPDATE scheduled_tasks SET next_run_at = ?, last_run_at = datetime('now') WHERE id = ?`,
		nextRunAt, taskID,
	)
	return err
}

// ─────────────────────────────────────────
// 内部工具函数
// ─────────────────────────────────────────

func boolInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

func nullStr(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

func scanMessages(rows *sql.Rows) ([]DbMessage, error) {
	var msgs []DbMessage
	for rows.Next() {
		var m DbMessage
		var isGroup, processed int
		if err := rows.Scan(
			&m.ID, &m.Channel, &m.ChatJID, &m.SenderJID, &m.SenderName,
			&m.Text, &m.Timestamp, &isGroup, &m.GroupName, &processed, &m.CreatedAt,
		); err != nil {
			return nil, err
		}
		m.IsGroup = isGroup == 1
		m.Processed = processed == 1
		msgs = append(msgs, m)
	}
	return msgs, rows.Err()
}

func scanTasks(rows *sql.Rows) ([]ScheduledTask, error) {
	var tasks []ScheduledTask
	for rows.Next() {
		var t ScheduledTask
		var isPaused int
		if err := rows.Scan(
			&t.ID, &t.GroupFolder, &t.Prompt, &t.ScheduleType, &t.ScheduleValue,
			&isPaused, &t.CreatedAt, &t.LastRunAt, &t.NextRunAt,
		); err != nil {
			return nil, err
		}
		t.IsPaused = isPaused == 1
		tasks = append(tasks, t)
	}
	return tasks, rows.Err()
}
