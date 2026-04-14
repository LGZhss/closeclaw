/**
 * 沙盒管理器
 * 负责协调代码执行、资源限制和环境隔离
 */

import { ProcessExecutor, ExecutionResult } from "./process-executor.js";
import { logger } from "../logger.js";
import { config } from "../config.js";

/**
 * 沙盒运行参数
 */
export interface SandboxRunParams {
  /** 任务类型: "code" (JS) 或 "cmd" (Shell) */
  type: "code" | "cmd";
  /** 执行内容 */
  content: string;
  /** 执行上下文（可选） */
  context?: Record<string, unknown>;
}

/**
 * 沙盒运行时元数据
 */
export interface SandboxMetadata {
  /** 任务 ID */
  traceId: string;
  /** 开始时间 */
  startTime: number;
}

export class SandboxManager {
  private executor: ProcessExecutor;
  /** 运行中的会话: traceId -> Metadata */
  private activeSessions: Map<string, SandboxMetadata>;

  constructor() {
    this.executor = new ProcessExecutor();
    this.activeSessions = new Map();
  }

  /**
   * 运行沙盒任务
   * @param params 运行参数
   * @param traceId 追踪 ID
   * @returns 执行结果
   */
  async run(
    params: SandboxRunParams,
    traceId: string,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    this.activeSessions.set(traceId, { traceId, startTime });

    logger.info(`[Sandbox] Starting ${params.type} execution (${traceId})`);

    try {
      let result: ExecutionResult = { stdout: "", stderr: "", exitCode: -1 };

      if (params.type === "code") {
        // 执行 JavaScript 代码
        result = await this.executor.execute(params.content, {
          timeout: config.sandbox.timeout,
        });
      } else if (params.type === "cmd") {
        // 执行 Shell 命令
        result = await this.executor.executeCommand(params.content, {
          timeout: config.sandbox.timeout,
        });
      } else {
        throw new Error(`Unsupported sandbox type: ${(params as any).type}`);
      }

      const duration = Date.now() - startTime;

      // P033: 高性能审计日志实现
      // 使用截断逻辑防止日志因 stdout 过大而溢出，仅对 traceId、退出码和截断后的输出进行基础记录
      const safeStdout =
        result.stdout.length > 500
          ? result.stdout.slice(0, 500) + "... [truncated]"
          : result.stdout;

      logger.info(
        `[Sandbox] Execution finished (${traceId}) in ${duration}ms, exitCode: ${result.exitCode}`,
      );
      logger.debug(`[Sandbox] Output preview (${traceId}): ${safeStdout}`);
      if (result.stderr) {
        logger.warn(
          `[Sandbox] Execution stderr (${traceId}): ${result.stderr}`,
        );
      }

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[Sandbox] Execution failed (${traceId}): ${message}`);
      throw error;
    } finally {
      this.activeSessions.delete(traceId);
    }
  }

  /**
   * 强制停止特定任务
   * @param traceId 追踪 ID
   */
  async stop(traceId: string): Promise<boolean> {
    logger.warn(`[Sandbox] Force stopping execution (${traceId})`);
    // 注意: 当前 ProcessExecutor.stop 需要 executionId 而非 traceId
    // 这里需要后续进一步完善 traceId 与 executionId 的映射，目前仅作示意
    return false;
  }

  /**
   * 关闭沙盒管理器，释放资源
   */
  async close(): Promise<void> {
    logger.info("[Sandbox] Closing SandboxManager...");
    await this.executor.close();
    this.activeSessions.clear();
  }

  /**
   * 获取活跃会话列表
   */
  getActiveSessions(): SandboxMetadata[] {
    return Array.from(this.activeSessions.values());
  }
}
