import { AgentRunner, ExecutionContext } from './runner.js';
import { getAdapter } from '../adapters/registry.js';
import { logger } from '../logger.js';

/**
 * 基于 Sandbox 的 Agent Runner 实现
 * 通过 AdapterRegistry 获取 LLM Adapter 并执行
 */
export class SandboxRunner implements AgentRunner {
  private adapterName: string;

  constructor(adapterName: string = 'openai') {
    this.adapterName = adapterName;
  }

  async execute(context: ExecutionContext): Promise<string> {
    logger.debug(`[SandboxRunner] Executing with adapter: ${this.adapterName}`);

    // 获取 LLM Adapter
    const adapter = getAdapter(this.adapterName);
    if (!adapter) {
      const error = `No LLM adapter available: ${this.adapterName}`;
      logger.error(`[SandboxRunner] ${error}`);
      return `Error: ${error}`;
    }

    try {
      // 调用 LLM
      const response = await adapter.chat({
        systemInstruction: 'You are a helpful assistant.',
        history: context.history || [],
        message: context.prompt,
        preferredLevel: 'pro'
      });

      logger.debug(`[SandboxRunner] LLM response received`);
      return response.text;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[SandboxRunner] Execution failed: ${errorMsg}`);
      return `Error: ${errorMsg}`;
    }
  }

  async close(): Promise<void> {
    logger.debug(`[SandboxRunner] Closing`);
    // 当前实现无需清理资源
    // 未来如果使用持久化连接，在此处清理
  }
}
