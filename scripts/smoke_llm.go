// kernel/llm_test.go — 微内核 LLM 连通性冒烟测试
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	pb "closeclaw-kernel/proto"
)

func main() {
	// 连接本地内核总线
	conn, err := grpc.Dial("127.0.0.1:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("无法连接内核: %v", err)
	}
	defer conn.Close()

	client := pb.NewKernelBusClient(conn)

	// 构造测试请求 (携带 TraceID)
	req := &pb.ChatRequest{
		Trace: &pb.TraceContext{
			TraceId:      "smoke-test-027",
			CreatedAtMs: time.Now().UnixMilli(),
		},
		Message: "你好，请确认你已收到 CloseClaw Phase 3B 的指令？",
		History: []string{"系统启动中..."},
	}

	fmt.Println(">>> 正在发送 LLM 推理请求 (TraceID: smoke-test-027)...")
	
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	resp, err := client.Chat(ctx, req)
	if err != nil {
		log.Fatalf("Chat RPC 失败: %v", err)
	}

	fmt.Printf("<<< 收到回复 (状态: %s):\n%s\n", resp.Status, resp.Text)
}
