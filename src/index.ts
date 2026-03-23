import { SandboxRunner } from "./agent/sandbox-runner.js";
import { logger } from "./logger.js";
import { ASSISTANT_NAME } from "./config.js";
import "./adapters/openai.js"; // Trigger adapter self-registration

// Phase2 POC: 模拟 gRPC 客户端桩 (未来使用 @grpc/grpc-js 真正连接 Go Kernel)
class MockKernelBusClient {
  async connect() {
    logger.info("模拟连接至 Go KernelBus gRPC 服务...");
    return new Promise((resolve) => setTimeout(resolve, 500));
  }

  // 模拟从 Go 接收 DispatchTask
  onTaskDispatch(callback: (task: any) => Promise<void>) {
    // 模拟 2 秒后收到一个来自 Go 的任务
    setTimeout(async () => {
      logger.info("[gRPC IN] 收到 Go 内核下发的任务指派");
      await callback({
        taskId: "task-001",
        groupFolder: "main",
        prompt: "你好，请生成一个测试回复以验证 TS 沙盒无状态化。",
      });
    }, 2000);
  }

  // 模拟向 Go 发送 StatusUpdate
  async syncStatus(taskId: string, status: string, error?: string) {
    logger.info(`[gRPC OUT] 向 Go 内核同步任务状态: taskId=${taskId}, status=${status}, error=${error}`);
  }
}

async function handleDispatchedTask(client: MockKernelBusClient, task: any) {
  try {
    await client.syncStatus(task.taskId, "RUNNING");
    logger.info(`开始在无状态沙盒中执行任务: ${task.taskId}`);

    const runner = new SandboxRunner('openai');
    
    // 执行环境已隔离，没有传真实的 channel，只做上下文处理
    const context = {
      groupFolder: task.groupFolder,
      prompt: task.prompt,
      channel: null as any, 
      history: []
    };
    
    const response = await runner.execute(context);
    logger.info(`沙盒执行完毕，输出结果: ${response.substring(0, 50)}...`);
    
    await runner.close();
    await client.syncStatus(task.taskId, "COMPLETED");

  } catch (error) {
    logger.error(`沙盒任务崩溃: ${error}`);
    await client.syncStatus(task.taskId, "FAILED", String(error));
  }
}

async function main(): Promise<void> {
  logger.info(`启动 ${ASSISTANT_NAME} 无状态沙盒节点 v0.1.0-phase2...`);

  try {
    const grpcClient = new MockKernelBusClient();
    await grpcClient.connect();

    logger.info("等待 Go 内核指派任务...");

    grpcClient.onTaskDispatch(async (task) => {
      await handleDispatchedTask(grpcClient, task);
      
      // Phase2 POC: 测试走完一条鞭链路后自动退出，验证结束
      setTimeout(() => {
        logger.info("链路跑通，验证完成。退出沙盒。");
        process.exit(0);
      }, 1000);
    });

  } catch (error) {
    logger.error(`致命错误: ${error}`);
    process.exit(1);
  }
}

main();
