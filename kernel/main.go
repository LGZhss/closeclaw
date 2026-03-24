// kernel/main.go — Go 内核总线入口
package main

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"closeclaw-kernel/db"
	"closeclaw-kernel/scheduler"
	"closeclaw-kernel/server"
)

func main() {
	// 日志格式化
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	slog.Info(fmt.Sprintf("[CloseClaw Kernel] 启动 Go 内核总线 v0.1.0-phase2+ (OS: %s)", runtime.GOOS))

	// 初始化数据库
	storeDir := os.Getenv("WORKSPACE_DIR")
	if storeDir == "" {
		if configDir, err := os.UserConfigDir(); err == nil {
			storeDir = filepath.Join(configDir, "closeclaw", "data")
		} else {
			// 回退到当前目录，避免使用公共临时目录
			storeDir = "./data"
		}
	}
	// 确保目录存在
	if err := os.MkdirAll(storeDir, 0755); err != nil {
		slog.Error("无法创建数据目录", "dir", storeDir, "err", err)
		os.Exit(1)
	}

	// 1. 初始化数据库
	_, err := db.InitDB(storeDir)
	if err != nil {
		slog.Error("SQLite 初始化失败", "err", err)
		os.Exit(1)
	}

	// 启动 gRPC 服务与调度器关联
	srv := server.NewKernelBusServer()

	// 启动 Go 任务调度器 (Phase 2+)
	pool := scheduler.NewGroupPool(5) // max 5 concurrent tasks globally
	sched := scheduler.NewScheduler(pool, srv)
	sched.Start(time.Minute) // 对应 SCHEDULER_POLL_INTERVAL = 60000ms
	defer sched.Stop()

	// 启动 gRPC 服务（阻塞）
	if err := server.Start(srv); err != nil {
		slog.Error("gRPC 服务异常退出", "err", err)
		os.Exit(1)
	}
}
