/**
 * 沙盒管理器
 * 负责管理沙盒执行环境，实现多级隔离策略
 */

import { logger } from "../logger.js";
import {
  ProcessExecutor,
  ExecutionResult,
  ExecutionOptions,
} from "./process-executor.js";

export interface ExecutionHistoryEntry {
  id: string;
  code?: string;
  command?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "running" | "completed" | "failed" | "stopped";
  result?: ExecutionResult | { error: string };
}

export class SandboxManager {
  private executors: {
    process: ProcessExecutor;
  };
  private executionHistory: Map<string, ExecutionHistoryEntry>;

  constructor() {
    this.executors = {
      process: new ProcessExecutor(),
    };
    this.executionHistory = new Map();
  }

  /**
   * 执行代码
   * @param code 要执行的代码
   * @param options 执行选项
   * @returns 执行结果
   */
  async execute(
    code: string,
    options: ExecutionOptions = {},
  ): Promise<ExecutionResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const startTime = Date.now();

    try {
      // 记录执行开始
      this.executionHistory.set(executionId, {
        id: executionId,
        code: code.slice(0, 100) + (code.length > 100 ? "..." : ""),
        startTime,
        status: "running",
      });

      // 优先使用子进程隔离
      logger.info(`[Sandbox] 尝试使用子进程执行代码 (ID: ${executionId})`);
      const result = await this.executors.process.execute(code, options);
      this._updateExecutionStatus(executionId, "completed", result);
      return result;
    } catch (error: any) {
      this._updateExecutionStatus(executionId, "failed", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 执行命令
   * @param command 要执行的命令
   * @param options 执行选项
   * @returns 执行结果
   */
  async executeCommand(
    command: string,
    options: ExecutionOptions = {},
  ): Promise<ExecutionResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const startTime = Date.now();

    try {
      // 记录执行开始
      this.executionHistory.set(executionId, {
        id: executionId,
        command,
        startTime,
        status: "running",
      });

      // 使用子进程执行命令
      logger.info(`[Sandbox] 尝试使用子进程执行命令: ${command}`);
      const result = await this.executors.process.executeCommand(
        command,
        options,
      );
      this._updateExecutionStatus(executionId, "completed", result);
      return result;
    } catch (error: any) {
      this._updateExecutionStatus(executionId, "failed", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 停止执行
   * @param executionId 执行ID
   * @returns 是否成功停止
   */
  async stopExecution(executionId: string): Promise<boolean> {
    const execution = this.executionHistory.get(executionId);
    if (!execution) {
      return false;
    }

    try {
      await this.executors.process.stop(executionId);
      this._updateExecutionStatus(executionId, "stopped");
      return true;
    } catch (error: any) {
      logger.error(`[Sandbox] 停止执行失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取执行状态
   * @param executionId 执行ID
   * @returns 执行状态
   */
  getExecutionStatus(executionId: string): ExecutionHistoryEntry | null {
    return this.executionHistory.get(executionId) || null;
  }

  /**
   * 清理过期的执行记录
   * @param days 天数
   */
  cleanupExpiredExecutions(days: number = 1): void {
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    let removed = 0;

    for (const [executionId, execution] of this.executionHistory.entries()) {
      if (execution.startTime < cutoffTime) {
        this.executionHistory.delete(executionId);
        removed++;
      }
    }

    if (removed > 0) {
      logger.info(`[Sandbox] 清理了 ${removed} 个过期执行记录`);
    }
  }

  /**
   * 关闭沙盒管理器
   */
  async close(): Promise<void> {
    try {
      await this.executors.process.close();
      logger.info("[Sandbox] 沙盒管理器已关闭");
    } catch (error: any) {
      logger.error(`[Sandbox] 关闭沙盒管理器失败: ${error.message}`);
    }
  }

  /**
   * 更新执行状态
   * @private
   */
  private _updateExecutionStatus(
    executionId: string,
    status: ExecutionHistoryEntry["status"],
    result: any = null,
  ): void {
    const execution = this.executionHistory.get(executionId);
    if (execution) {
      execution.status = status;
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
      if (result) {
        execution.result = result;
      }
    }
  }
}

export const sandboxManager = new SandboxManager();
