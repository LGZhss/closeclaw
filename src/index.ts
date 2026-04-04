import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { resolve } from "path";
import { SandboxRunner } from "./agent/sandbox-runner.js";
import { logger } from "./logger.js";
import { ASSISTANT_NAME } from "./config.js";
// 纭繚閫傞厤鍣ㄨ嚜鍔ㄦ敞鍐岋紙鐩墠浠呬繚鐣欏崗浣滀富浣撻€傞厤鍣紝鐢卞叾鑷韩娉ㄥ唽锛?
/**
 * GrpcKernelBusClient - 姝ｅ紡 gRPC 瀹㈡埛绔繛鎺?Go 鍐呮牳
 */
class GrpcKernelBusClient {
  private client: any; // gRPC 鍔ㄦ€佺敓鎴愮殑瀹㈡埛绔€氬父涓?any锛屼絾鎴戜滑浼氶€氳繃绫诲瀷瀹堝崼淇濇姢璋冪敤
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
      const KernelBus = protoDescriptor.closeclaw.v1.KernelBus;

      // @grpc/grpc-js 不支持 Named Pipe，使用 TCP 连接
      // Go 内核同时监听 TCP (127.0.0.1:50051) 和 Named Pipe
      const target = "127.0.0.1:50051";

      this.client = new KernelBus(target, grpc.credentials.createInsecure());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`[TS Sandbox] Failed to load proto: ${message}`);
    }
  }

  start() {
    logger.info(
      `[TS Sandbox] Connecting to Go Kernel via TCP at 127.0.0.1:50051...`,
    );
    this.subscribeTasks();
  }

  private subscribeTasks() {
    // 璋冪敤鎴戜滑鍦?proto 涓柊澧炵殑 SubscribeTasks stream
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
      // 鎸囨暟閫€閬块噸杩?      setTimeout(() => this.subscribeTasks(), 5000);
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
