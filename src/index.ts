/**
 * CloseClaw 系统主入口 (TS 哑终端层)
 * 仅负责监听内核指令并分发到沙盒或适配器执行
 */

import { GrpcKernelBusClient } from "./bus/grpc-client.js";
import { SandboxManager } from "./sandbox/manager.js";
import { LLMAdapterRegistry } from "./adapters/registry.js";
import { logger } from "./logger.js";
import { config } from "./config.js";
import { cleanupTmpFiles } from "./utils/fs-cleanup.js";

async function main() {
  logger.info("CloseClaw TS Sandbox Starting...");

  // 1. 初始化沙盒管理器
  const sandboxManager = new SandboxManager();
  
  // 2. 初始化 LLM 适配器注册表
  const adapterRegistry = new LLMAdapterRegistry();

  // 3. 核心加固 (P031): 初始化 IPC 通讯
  // 强制使用 Named Pipe (Win) 或 Unix Socket (Unix)，绝不回退到 TCP 127.0.0.1:50051
  const busClient = new GrpcKernelBusClient({
    target: process.platform === "win32" 
      ? `\\\\.\\pipe\\closeclaw_bus` 
      : `unix:///tmp/closeclaw_bus.sock`
  });

  try {
    // 4. 连接内核总线
    await busClient.connect();
    logger.info(`Connected to kernel bus via ${busClient.target}`);

    // 5. 注册消息处理器
    busClient.onMessage(async (msg) => {
      const { type, payload, traceId } = msg;
      logger.debug(`[${traceId}] Received message: ${type}`);

      try {
        switch (type) {
          case "EXEC_SANDBOX":
            return await sandboxManager.run(payload, traceId);
          case "LLM_CHAT":
            return await adapterRegistry.get(payload.provider).chat(payload.params);
          case "HEALTH_CHECK":
            return { status: "OK", version: "0.1.0" };
          default:
            throw new Error(`Unknown message type: ${type}`);
        }
      } catch (err: any) {
        logger.error(`[${traceId}] Error processing message: ${err.message}`);
        return { error: err.message };
      }
    });

    // 6. 定期清理临时文件 (P033 定时任务)
    setInterval(() => {
      cleanupTmpFiles().catch(err => logger.warn(`[Cleanup] Failed: ${err.message}`));
    }, 1000 * 60 * 60); // 每小时执行一次

    // 监听关闭信号
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      await sandboxManager.close();
      process.exit(0);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  } catch (err: any) {
    logger.error(`CloseClaw TS Sandbox failed to start: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
