// kernel/main.go — Go 内核总线入口
package main

import (
	"log/slog"
	"os"
	"path/filepath"

	"closeclaw-kernel/db"
	"closeclaw-kernel/server"
)

func main() {
	// 日志格式化
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	slog.Info("[CloseClaw Kernel] 启动 Go 内核总线 v0.1.0-phase1")

	// 初始化数据库
	storeDir := os.Getenv("WORKSPACE_DIR")
	if storeDir == "" {
		storeDir = filepath.Join(os.TempDir(), "closeclaw-data")
	}
	if _, err := db.InitDB(storeDir); err != nil {
		slog.Error("SQLite 初始化失败", "err", err)
		os.Exit(1)
	}

	// 启动 gRPC 服务（阻塞）
	if err := server.Start(); err != nil {
		slog.Error("gRPC 服务异常退出", "err", err)
		os.Exit(1)
	}
}
