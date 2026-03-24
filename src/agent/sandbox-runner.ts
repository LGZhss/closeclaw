import { AgentRunner, ExecutionContext } from './runner.js';
import { logger } from '../logger.js';

/**
 * 基于 Sandbox 的 Agent Runner 实现
 * 通过 gRPC 调用 Go 内核的 Chat 接口执行 LLM 推理 (Phase 3B)
 */
export class SandboxRunner implements AgentRunner {
  private client: any;

  constructor(client: any) {
    this.client = client;
  }

  async execute(context: ExecutionContext): Promise<string> {
    logger.debug(`[SandboxRunner] Executing via gRPC Chat`);

    try {
      // 构造 gRPC 请求
      const chatRequest = {
        trace: {
          trace_id: (context as ExecutionContext & { trace_id?: string }).trace_id || 'manual-' + Date.now(),
          created_at_ms: Date.now()
        },
        message: context.prompt,
        history: (context.history || []).map(h => h.parts.map(p => p.text).join('\n')),
        options: {
          model: 'free'
        }
      };

      // 调用 Go 内核的 Chat RPC
      return new Promise((resolve) => {
        this.client.Chat(chatRequest, (err: Error | null, response: { status?: number | string; text: string; error?: string }) => {
          if (err) {
            logger.error(`[SandboxRunner] gRPC Chat failed: ${err.message}`);
            resolve(`Error: ${err.message}`);
            return;
          }
          
          if (response.status === 2 || response.status === 'DONE') {
            logger.debug(`[SandboxRunner] LLM response received via gRPC`);
            resolve(response.text);
          } else {
            const error = response.error || 'Unknown error';
            logger.error(`[SandboxRunner] LLM inference failed: ${error}`);
            resolve(`Error: ${error}`);
          }
        });
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[SandboxRunner] Execution failed: ${errorMsg}`);
      return `Error: ${errorMsg}`;
    }
  }

  async close(): Promise<void> {
    logger.debug(`[SandboxRunner] Closing`);
  }
}
