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
	"sync"
	"sync/atomic"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"closeclaw-kernel/db"
	"closeclaw-kernel/llm"
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
	startTime        time.Time
	activeGoroutines atomic.Int32
	// tsStreams 存储当前活跃的 TS 沙盒订阅流，用于广播任务
	tsStreams        sync.Map // map[chan *pb.Task]bool
	
	// LLM 客户端 (Phase 3B)
	llmClient        *llm.Client
}

// NewKernelBusServer 创建服务实例。
func NewKernelBusServer() *KernelBusServer {
	return &KernelBusServer{
		startTime: time.Now(),
		llmClient: llm.NewClient(),
	}
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
	)

	// 写入 SQLite
	taskIDStr := req.GetTaskId()
	var taskID int64
	fmt.Sscanf(taskIDStr, "%d", &taskID) // 尝试从 string 转 int64，如果是 UUID 则由 DB 处理或映射

	dbTask := db.ScheduledTask{
		GroupFolder:   req.GetGroupFolder(),
		Prompt:        string(req.GetPayload()),
		ScheduleType:  req.GetScheduleType(),
		ScheduleValue: req.GetScheduleValue(),
		IsPaused:      false,
		CreatedAt:     time.Now().UTC().Format(time.RFC3339),
		Status:        "PENDING",
		DependsOn:     "",
	}
	
	// 如果 req.DependsOn 是 repeated string，我们需要将其转换为逗号分隔字符串
	if len(req.GetDependsOn()) > 0 {
		var deps string
		for i, d := range req.GetDependsOn() {
			if i > 0 {
				deps += ","
			}
			deps += d
		}
		dbTask.DependsOn = deps
	}

	_, err := db.InsertTask(db.GetDB(), dbTask)
	if err != nil {
		slog.Error("Failed to insert task from gRPC", "err", err)
		return nil, status.Errorf(codes.Internal, "DB insert failed: %v", err)
	}

	elapsed := time.Since(start).Milliseconds()
	return &pb.TaskResponse{
		TaskId:    req.GetTaskId(),
		Status:    pb.TaskStatus_PENDING,
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

	// 更新数据库状态
	var taskID int64
	fmt.Sscanf(req.GetTaskId(), "%d", &taskID)
	
	statusStr := req.GetStatus().String()
	if err := db.UpdateTaskStatus(db.GetDB(), taskID, statusStr); err != nil {
		slog.Error("Failed to update task status from gRPC", "task_id", taskID, "err", err)
		return nil, status.Errorf(codes.Internal, "DB update failed: %v", err)
	}

	// TODO: 记录到 task_run_logs

	return &pb.Ack{Ok: true, Message: "状态已同步至内核"}, nil
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
			ID:         int64(i + 1),
			Channel:    "telegram",
			ChatJID:    "test@g.us",
			SenderJID:  "sender@s.com",
			SenderName: "测试用户",
			Text:       fmt.Sprintf("@Andy 请看第 %d 条 Phase2 POC", i+1),
			Timestamp:  time.Now().UnixMilli(),
			IsGroup:    true,
		}

		if router.ShouldTrigger(cfg, dbMsg.Text) {
			prompt := router.BuildAgentPrompt(cfg, []db.Message{dbMsg})
			
			// 发送给 Dart 的就是构建好的 Prompt
			msg := &pb.IncomingMessage{
				Id:         dbMsg.ID,
				Channel:    dbMsg.Channel,
				ChatJid:    dbMsg.ChatJID,
				SenderJid:  dbMsg.SenderJID,
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

// SubscribeTasks 允许 TS 无状态沙盒订阅实时任务流。
func (s *KernelBusServer) SubscribeTasks(req *pb.Ack, stream pb.KernelBus_SubscribeTasksServer) error {
	slog.Info("[IPC] TS Sandbox subscribed to task stream")
	
	// 为该流创建一个下发通道
	taskCh := make(chan *pb.Task, 100)
	s.tsStreams.Store(taskCh, true)
	defer s.tsStreams.Delete(taskCh)

	for {
		select {
		case <-stream.Context().Done():
			slog.Info("[IPC] TS Sandbox unsubscribed")
			return nil
		case task := <-taskCh:
			if err := stream.Send(task); err != nil {
				slog.Error("[IPC] Stream send failed", "err", err)
				return err
			}
		}
	}
}

// BroadcastTask 将任务推送到所有活跃的 TS 沙盒。
func (s *KernelBusServer) BroadcastTask(task *pb.Task) {
	slog.Info("[IPC] Broadcasting task to sandboxes", "task_id", task.GetTaskId())
	s.tsStreams.Range(func(key, value interface{}) bool {
		taskCh := key.(chan *pb.Task)
		select {
		case taskCh <- task:
		default:
			slog.Warn("[IPC] Task channel full, skipping client")
		}
		return true
	})
}

// Chat 处理来自 TS 执行层的推理请求 (Phase 3B)。
func (s *KernelBusServer) Chat(ctx context.Context, req *pb.ChatRequest) (*pb.ChatResponse, error) {
	slog.Info("收到 Chat 请求", "trace_id", req.GetTrace().GetTraceId(), "msg_len", len(req.GetMessage()))
	
	// 调用 Go 侧 LLM 客户端
	resp, err := s.llmClient.Chat(req.GetMessage(), req.GetHistory())
	if err != nil {
		slog.Error("LLM 推理失败", "err", err)
		return &pb.ChatResponse{
			Status: pb.TaskStatus_FAILED,
			Error:  err.Error(),
		}, nil
	}

	return &pb.ChatResponse{
		Text:   resp,
		Status: pb.TaskStatus_DONE,
	}, nil
}
// Start 启动 gRPC 服务并阻塞监听。
func Start(srv *KernelBusServer) error {
	lis, err := listen()
	if err != nil {
		return fmt.Errorf("创建监听器失败: %w", err)
	}
	s := grpc.NewServer(
		grpc.MaxRecvMsgSize(4*1024*1024),
		grpc.MaxSendMsgSize(4*1024*1024),
	)
	pb.RegisterKernelBusServer(s, srv)

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
