import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { resolve } from "path";
import { SandboxRunner } from "./agent/sandbox-runner.js";
import { logger } from "./logger.js";
import { ASSISTANT_NAME } from "./config.js";
// 确保适配器自动注册（目前仅保留协作主体适配器，由其自身注册）

/**
 * GrpcKernelBusClient - 正式 gRPC 客户端连接 Go 内核
 */
class GrpcKernelBusClient {
  private readonly client: any;
  private readonly protoPath: string;

  constructor() {
    this.protoPath = resolve(process.cwd(), "proto/messages.proto");

    try {
      const packageDefinition = protoLoader.loadSync(this.protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });
      const protoDescriptor = grpc.loadPackageDefinition(
        packageDefinition,
      ) as any;
      // 对应 proto 中的 package closeclaw.v1;
      const KernelBus = protoDescriptor.closeclaw.v1.KernelBus;

      this.client = new KernelBus(
        "127.0.0.1:50051",
        grpc.credentials.createInsecure(),
      );
    } catch (err: any) {
      logger.error(`[TS Sandbox] Failed to load proto: ${err.message}`);
    }
  }

  start() {
    logger.info(
      "[TS Sandbox] Connecting to Go Kernel via gRPC at 127.0.0.1:50051...",
    );
    this.subscribeTasks();
  }

  private subscribeTasks() {
    // 调用我们在 proto 中新增的 SubscribeTasks stream
    const call = this.client.SubscribeTasks({ ok: true, message: "Ready" });

    call.on("data", async (task: any) => {
      const taskId = task.task_id || task.id; // 容错处理，但优先使用 task_id
      logger.info(`[TS Sandbox] Received dispatched task: ${taskId}`);

      const runner = new SandboxRunner(this.client);

      try {
        const context = {
          groupFolder: task.group_folder || "global",
          prompt: task.payload ? task.payload.toString() : "",
          history: task.history || [],
          trace_id: task.trace?.trace_id || "ts-" + Date.now(),
        };

        const responseText = await runner.execute(context);
        logger.info(`[TS Sandbox] Task ${taskId} execution completed.`);

        await this.syncStatus({
          task_id: taskId,
          trace_id: context.trace_id,
          status: "DONE",
          result: Buffer.from(responseText),
        });
      } catch (err: any) {
        logger.error(
          `[TS Sandbox] Task ${taskId} execution failed: ${err.message}`,
        );
        await this.syncStatus({
          task_id: taskId,
          trace_id: task.trace?.trace_id,
          status: "FAILED",
          error: err.message,
        });
      } finally {
        await runner.close();
      }
    });

    call.on("error", (err: any) => {
      logger.error(`[TS Sandbox] gRPC Stream Error: ${err.message}`);
      // 指数退避重连
      setTimeout(() => this.subscribeTasks(), 5000);
    });

    call.on("status", (status: any) => {
      logger.debug(
        `[TS Sandbox] gRPC Stream Status: ${JSON.stringify(status)}`,
      );
    });

    call.on("end", () => {
      logger.warn("[TS Sandbox] gRPC Stream ended by server. Reconnecting...");
      setTimeout(() => this.subscribeTasks(), 5000);
    });
  }

  private async syncStatus(update: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.SyncStatus(update, (err: any, response: any) => {
        if (err) {
          logger.error(`[TS Sandbox] SyncStatus report failed: ${err.message}`);
          reject(err);
        } else {
          logger.debug(
            `[TS Sandbox] Status synced: ${update.task_id} -> ${update.status}`,
          );
          resolve(response);
        }
      });
    });
  }
}

async function main() {
  logger.info(
    `[TS Sandbox] ${ASSISTANT_NAME} Stateless Execution Plane starting...`,
  );
  const client = new GrpcKernelBusClient();
  client.start();
}

main().catch((err) => {
  logger.error(`[TS Sandbox] Fatal error: ${err.message}`);
  process.exit(1);
});
