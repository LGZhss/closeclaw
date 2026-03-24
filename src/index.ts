import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { resolve } from 'path';
import { SandboxRunner } from './agent/sandbox-runner.js';
import { logger } from './logger.js';
import { ASSISTANT_NAME } from './config.js';
import './adapters/openai.js'; // 确保适配器自动注册

/**
 * GrpcKernelBusClient - 正式 gRPC 客户端连接 Go 内核
 */
class GrpcKernelBusClient {
  private readonly client: any;
  private readonly protoPath: string;

  constructor() {
    this.protoPath = resolve(process.cwd(), 'proto/messages.proto');
    
    try {
      const packageDefinition = protoLoader.loadSync(this.protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      });
      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
      // 对应 proto 中的 package closeclaw.v1;
      const KernelBus = protoDescriptor.closeclaw.v1.KernelBus;
      
      this.client = new KernelBus(
        '127.0.0.1:50051', 
        grpc.credentials.createInsecure()
      );
    } catch (err: any) {
      logger.error(`[TS Sandbox] Failed to load proto: ${err.message}`);
    }
  }

  start() {
    logger.info('[TS Sandbox] Connecting to Go Kernel via gRPC at 127.0.0.1:50051...');
    this.subscribeTasks();
  }

  private subscribeTasks() {
    // 调用我们在 proto 中新增的 SubscribeTasks stream
    const call = this.client.SubscribeTasks({ ok: true, message: 'Ready' });
    
    call.on('data', async (task: any) => {
      logger.info(`[TS Sandbox] Received dispatched task: ${task.id}`);
      
      const runner = new SandboxRunner(this.client); // 默认使用 openai 适配器
      
      try {
        // 构建执行上下文，由于是无状态沙盒，channel 为空，由 Go 控制逻辑处理响应
        const context = {
          groupFolder: task.group_jid || 'global',
          prompt: task.payload || '',
          history: [], // 后续可由 Go 侧下发历史片段
          trace_id: task.trace?.trace_id || 'ts-' + Date.now()
        };
        
        const responseText = await runner.execute(context);
        logger.info(`[TS Sandbox] Task ${task.id} execution completed.`);
        
        // 汇报状态至内核
        await this.syncStatus({
          task_id: task.task_id,
          trace_id: task.trace?.trace_id,
          status: 'DONE',
          result: Buffer.from(responseText)
        });
      } catch (err: any) {
        logger.error(`[TS Sandbox] Task ${task.id} execution failed: ${err.message}`);
        await this.syncStatus({
          task_id: task.task_id,
          trace_id: task.trace?.trace_id,
          status: 'FAILED',
          error: err.message
        });
      } finally {
        await runner.close();
      }
    });

    call.on('error', (err: any) => {
      logger.error(`[TS Sandbox] gRPC Stream Error: ${err.message}`);
      // 指数退避重连
      setTimeout(() => this.subscribeTasks(), 5000);
    });

    call.on('status', (status: any) => {
      logger.debug(`[TS Sandbox] gRPC Stream Status: ${JSON.stringify(status)}`);
    });

    call.on('end', () => {
      logger.warn('[TS Sandbox] gRPC Stream ended by server. Reconnecting...');
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
          logger.debug(`[TS Sandbox] Status synced: ${update.task_id} -> ${update.status}`);
          resolve(response);
        }
      });
    });
  }
}

async function main() {
  logger.info(`[TS Sandbox] ${ASSISTANT_NAME} Stateless Execution Plane starting...`);
  const client = new GrpcKernelBusClient();
  client.start();
}

main().catch(err => {
  logger.error(`[TS Sandbox] Fatal error: ${err.message}`);
  process.exit(1);
});
