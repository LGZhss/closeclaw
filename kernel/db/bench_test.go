// Package db — SQLite WAL 高并发 Benchmark 测试
// 验收线（P027 Phase 1 门控）：
//   - BenchmarkBatchInsert1000:   ≤ 150ms  (150,000,000 ns)
//   - BenchmarkSingleQuery:       ≤ 0.8ms  (800,000 ns) per op
//   - BenchmarkConcurrentWrite:   无 "database is locked" 错误
package db

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"
	"time"
)

// setupBenchDB 在临时目录创建一个独立的测试 DB，避免污染生产数据。
func setupBenchDB(b *testing.B) *DB {
	b.Helper()
	dir := b.TempDir()
	db, err := InitDB(filepath.Join(dir, "bench.db"))
	if err != nil {
		b.Fatalf("InitDB 失败: %v", err)
	}
	return db
}

// BenchmarkBatchInsert1000 测试 1000 条消息的批量插入性能。
// 目标：完成时间 ≤ 150ms。
func BenchmarkBatchInsert1000(b *testing.B) {
	db := setupBenchDB(b)
	// 预先注册一个群组以满足外键约束
	if _, err := db.pool.Exec(
		`INSERT OR IGNORE INTO registered_groups (jid, name, folder, channel, added_at)
		 VALUES ('bench@g.us', 'bench', 'bench', 'telegram', datetime('now'))`,
	); err != nil {
		b.Fatal(err)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		// 使用事务批量插入，模拟真实消息入库场景
		tx, err := db.pool.Begin()
		if err != nil {
			b.Fatal(err)
		}
		stmt, _ := tx.Prepare(
			`INSERT INTO messages (channel, chat_jid, sender_jid, sender_name, text, timestamp, is_group, processed)
			 VALUES (?, ?, ?, ?, ?, ?, 1, 0)`,
		)
		for j := 0; j < 1000; j++ {
			_, err := stmt.Exec(
				"telegram", "bench@g.us", fmt.Sprintf("user%d", j),
				fmt.Sprintf("名字%d", j), fmt.Sprintf("消息内容 %d", j),
				time.Now().UnixMilli(),
			)
			if err != nil {
				tx.Rollback()
				b.Fatal(err)
			}
		}
		stmt.Close()
		if err := tx.Commit(); err != nil {
			b.Fatal(err)
		}
	}
	b.ReportAllocs()
}

// BenchmarkSingleQuery 测试单条消息查询延迟。
// 目标（P027 门控）：ns/op ≤ 800,000（即 ≤ 0.8ms）。
func BenchmarkSingleQuery(b *testing.B) {
	db := setupBenchDB(b)
	// 预热：写入 10k 条数据
	seedMessages(b, db, 10000)

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			msgs, err := GetUnprocessedMessages(db.pool, 100)
			if err != nil {
				b.Fatal(err)
			}
			_ = msgs
		}
	})
	b.ReportAllocs()
}

// BenchmarkConcurrentWrite 100 goroutine 同时插入，验证 WAL 无死锁。
func BenchmarkConcurrentWrite(b *testing.B) {
	db := setupBenchDB(b)
	if _, err := db.pool.Exec(
		`INSERT OR IGNORE INTO registered_groups (jid, name, folder, channel, added_at)
		 VALUES ('conc@g.us', 'conc', 'conc', 'telegram', datetime('now'))`,
	); err != nil {
		b.Fatal(err)
	}

	b.ResetTimer()
	b.SetParallelism(100)
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			msg := DbMessage{
				Channel: "telegram", ChatJID: "conc@g.us",
				SenderJID: "s@s.com", SenderName: "并发用户",
				Text: "并发测试消息", Timestamp: time.Now().UnixMilli(),
				IsGroup: true,
			}
			if _, err := InsertMessage(db.pool, msg); err != nil {
				// WAL 下不允许出现 "database is locked" 错误
				b.Errorf("并发写入失败（可能是锁争用）: %v", err)
			}
		}
	})
	b.ReportAllocs()
}

// seedMessages 向测试 DB 写入 n 条假数据。
func seedMessages(b *testing.B, db *DB, n int) {
	b.Helper()
	tx, _ := db.pool.Begin()
	stmt, _ := tx.Prepare(
		`INSERT INTO messages (channel, chat_jid, sender_jid, sender_name, text, timestamp, is_group, processed)
		 VALUES ('telegram','seed@g.us','seed@s.com','种子用户',?,?,1,0)`,
	)
	defer stmt.Close()
	for i := 0; i < n; i++ {
		stmt.Exec(fmt.Sprintf("种子消息#%d", i), time.Now().UnixMilli())
	}
	tx.Commit()
}

// DB 包装 sql.DB 以便 bench 调用，见 schema.go 定义
type DB struct {
	pool *sql.DB // 暴露给 bench，生产代码通过 GetDB() 访问
}

// 重新导出 InitDB 适配 bench 的 DB 包装类型
func init() {
	// 屏蔽 os 未使用警告（os.Exit 用于非 benchmark 测试入口）
	_ = os.Stderr
}
