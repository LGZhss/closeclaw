// Package server — KernelBus gRPC 服务端
// 在 Windows 上通过 Named Pipe \\.\pipe\closeclaw_ipc 监听，
// Linux/Mac 回退到 Unix Domain Socket /tmp/closeclaw.sock。
package server

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"runtime"
	"sync/atomic"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"closeclaw-kernel/db"
	pb "closeclaw-kernel/proto"
	"closeclaw-kernel/router"
)

const (
	// Windows Named Pipe 路径（全局命名空间，跨进程可见）
	pipePath = `\\.\pipe\closeclaw_ipc`
	// Unix fallback
	sockPath = "/tmp/closeclaw.sock"
)

// KernelBusServer 实现 pb.KernelBusServer 接口。
type KernelBusServer struct {
	pb.UnimplementedKernelBusServer
	startTime      time.Time
	activeGoroutines atomic.Int32
}

// NewKernelBusServer 创建服务实例。
func NewKernelBusServer() *KernelBusServer {
	return &KernelBusServer{startTime: time.Now()}
}

// DispatchTask 接收来自 Dart 的任务指令，写入 SQLite 并返回确认。
func (s *KernelBusServer) DispatchTask(ctx context.Context, req *pb.Task) (*pb.TaskResponse, error) {
	if req.GetTrace() == nil || req.GetTrace().GetTraceId() == "" {
		return nil, status.Error(codes.InvalidArgument, "trace.trace_id 为必填字段")
	}
	start := time.Now()
	slog.Info("收到 DispatchTask",
		"task_id", req.GetTaskId(),
		"trace_id", req.GetTrace().GetTraceId(),
		"group_jid", req.GetGroupJid(),
		"status", req.GetStatus(),
	)
	// TODO Phase2: 实际写入 SQLite (db.InsertTask)
	// 当前 Phase1 POC 直接返回 RUNNING 确认
	elapsed := time.Since(start).Milliseconds()
	return &pb.TaskResponse{
		TaskId:    req.GetTaskId(),
		Status:    pb.TaskStatus_RUNNING,
		ElapsedMs: elapsed,
	}, nil
}

// SyncStatus 接收来自 TS 沙盒的任务回写。
func (s *KernelBusServer) SyncStatus(ctx context.Context, req *pb.StatusUpdate) (*pb.Ack, error) {
	if req.GetTaskId() == "" {
		return nil, status.Error(codes.InvalidArgument, "task_id 不得为空")
	}
	slog.Info("收到 SyncStatus",
		"task_id", req.GetTaskId(),
		"status", req.GetStatus(),
		"error", req.GetError(),
	)
	return &pb.Ack{Ok: true, Message: "状态已接收"}, nil
}

// CheckHealth Dart 心跳探活接口。
func (s *KernelBusServer) CheckHealth(ctx context.Context, req *pb.HeartbeatRequest) (*pb.HeartbeatResponse, error) {
	uptime := int64(time.Since(s.startTime).Seconds())
	return &pb.HeartbeatResponse{
		Ok:               true,
		QueueLength:      0,
		ActiveGoroutines: s.activeGoroutines.Load(),
		KernelVersion:    "0.1.0-phase1",
		UptimeSeconds:    uptime,
	}, nil
}

// GetPendingMessages 流式推送待处理消息给 Dart。
func (s *KernelBusServer) GetPendingMessages(req *pb.Ack, stream pb.KernelBus_GetPendingMessagesServer) error {
	// Phase2 POC：结合 router 进行消息过滤和 Prompt 拼装
	cfg := router.DefaultConfig("Andy")
	
	for i := 0; i < 3; i++ {
		// Mock DB fetch
		dbMsg := db.Message{
			Id:         int64(i + 1),
			Channel:    "telegram",
			ChatJid:    "test@g.us",
			SenderJid:  "sender@s.com",
			SenderName: "测试用户",
			Text:       fmt.Sprintf("@Andy 请看第 %d 条 Phase2 POC", i+1),
			Timestamp:  time.Now().Format(time.RFC3339),
			IsGroup:    true,
		}

		if router.ShouldTrigger(cfg, dbMsg.Text) {
			prompt := router.BuildAgentPrompt(cfg, []db.Message{dbMsg})
			
			// 发送给 Dart 的就是构建好的 Prompt
			msg := &pb.IncomingMessage{
				Id:         dbMsg.Id,
				Channel:    dbMsg.Channel,
				ChatJid:    dbMsg.ChatJid,
				SenderJid:  dbMsg.SenderJid,
				SenderName: dbMsg.SenderName,
				Text:       prompt, // 最终发送加工后的 prompt
				Timestamp:  time.Now().UnixMilli(),
				IsGroup:    dbMsg.IsGroup,
			}
			if err := stream.Send(msg); err != nil {
				return fmt.Errorf("流式发送失败: %w", err)
			}
		}
		time.Sleep(200 * time.Millisecond)
	}
	return nil
}

// Start 启动 gRPC 服务并阻塞监听。
func Start() error {
	lis, err := listen()
	if err != nil {
		return fmt.Errorf("创建监听器失败: %w", err)
	}
	s := grpc.NewServer(
		grpc.MaxRecvMsgSize(4*1024*1024),
		grpc.MaxSendMsgSize(4*1024*1024),
	)
	pb.RegisterKernelBusServer(s, NewKernelBusServer())

	slog.Info("KernelBus gRPC 服务已启动", "addr", lis.Addr())
	return s.Serve(lis)
}

// listen 根据运行平台返回合适的 net.Listener。
func listen() (net.Listener, error) {
	if runtime.GOOS == "windows" {
		// Windows Named Pipe（需要额外依赖，Phase1 降级使用 TCP localhost）
		// 如果 npipe 库可用，替换为: npipe.Listen(pipePath)
		slog.Warn("Windows Named Pipe POC：当前使用 TCP 127.0.0.1:50051 代替 Named Pipe（依赖库待集成）")
		return net.Listen("tcp", "127.0.0.1:50051")
	}
	return net.Listen("unix", sockPath)
}
