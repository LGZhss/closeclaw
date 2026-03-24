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
  private client: any; // gRPC 动态生成的客户端通常为 any，但我们会通过类型守卫保护调用
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`[TS Sandbox] Failed to load proto: ${message}`);
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

    call.on(
      "data",
      async (task: {
        task_id?: string;
        id?: string;
        group_folder?: string;
        payload?: Buffer;
        history?: any[];
        trace?: { trace_id?: string };
      }) => {
        const taskId = task.task_id || task.id;
        if (!taskId) {
          logger.warn("[TS Sandbox] Received task without ID, ignoring.");
          return;
        }
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
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          logger.error(
            `[TS Sandbox] Task ${taskId} execution failed: ${message}`,
          );
          await this.syncStatus({
            task_id: taskId,
            trace_id: task.trace?.trace_id || "unknown",
            status: "FAILED",
            error: message,
          });
        } finally {
          await runner.close();
        }
      },
    );

    call.on("error", (err: Error) => {
      logger.error(`[TS Sandbox] gRPC Stream Error: ${err.message}`);
      // 指数退避重连
      setTimeout(() => this.subscribeTasks(), 5000);
    });

    call.on("status", (status: grpc.StatusObject) => {
      logger.debug(
        `[TS Sandbox] gRPC Stream Status: ${JSON.stringify(status)}`,
      );
    });

    call.on("end", () => {
      logger.warn("[TS Sandbox] gRPC Stream ended by server. Reconnecting...");
      setTimeout(() => this.subscribeTasks(), 5000);
    });
  }

  private async syncStatus(update: {
    task_id: string;
    trace_id?: string;
    status: string;
    result?: Buffer;
    error?: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.SyncStatus(update, (err: Error | null, response: any) => {
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

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(`[TS Sandbox] Fatal error: ${message}`);
  process.exit(1);
});
