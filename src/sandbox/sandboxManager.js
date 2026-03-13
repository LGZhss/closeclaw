/**
 * 沙盒管理器
 * 负责管理沙盒执行环境，实现多级隔离策略
 * 
 * 优先级顺序:
 * 1. 子进程 + IPC + 资源限制（基线隔离）
 * 2. Worker Threads + `vm`（可信脚本）
 * 3. isolated-vm（二期增强）
 */

import { log } from '../utils/logger.js';
import { config } from '../config/config.js';
import { ProcessExecutor } from './processExecutor.js';
import { WorkerExecutor } from './workerExecutor.js';

export class SandboxManager {
  constructor() {
    this.executors = {
      process: new ProcessExecutor(),
      worker: new WorkerExecutor()
    };
    this.executionHistory = new Map();
  }

  /**
   * 执行代码
   * @param {string} code 要执行的代码
   * @param {Object} options 执行选项
   * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
   */
  async execute(code, options = {}) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // 记录执行开始
      this.executionHistory.set(executionId, {
        id: executionId,
        code: code.slice(0, 100) + (code.length > 100 ? '...' : ''),
        startTime,
        status: 'running'
      });

      // 优先使用子进程隔离
      try {
        log(`[Sandbox] 尝试使用子进程执行代码`, 'INFO');
        const result = await this.executors.process.execute(code, options);
        this._updateExecutionStatus(executionId, 'completed', result);
        return result;
      } catch (processError) {
        log(`[Sandbox] 子进程执行失败，尝试使用 Worker Threads: ${processError.message}`, 'WARN');
        
        // 降级到 Worker Threads
        try {
          const result = await this.executors.worker.execute(code, options);
          this._updateExecutionStatus(executionId, 'completed', result);
          return result;
        } catch (workerError) {
          log(`[Sandbox] Worker Threads 执行失败: ${workerError.message}`, 'ERROR');
          throw new Error(`所有沙盒执行方式均失败: ${workerError.message}`);
        }
      }
    } catch (error) {
      this._updateExecutionStatus(executionId, 'failed', { error: error.message });
      throw error;
    }
  }

  /**
   * 执行命令
   * @param {string} command 要执行的命令
   * @param {Object} options 执行选项
   * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
   */
  async executeCommand(command, options = {}) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // 记录执行开始
      this.executionHistory.set(executionId, {
        id: executionId,
        command,
        startTime,
        status: 'running'
      });

      // 使用子进程执行命令
      const result = await this.executors.process.executeCommand(command, options);
      this._updateExecutionStatus(executionId, 'completed', result);
      return result;
    } catch (error) {
      this._updateExecutionStatus(executionId, 'failed', { error: error.message });
      throw error;
    }
  }

  /**
   * 停止执行
   * @param {string} executionId 执行ID
   * @returns {Promise<boolean>}
   */
  async stopExecution(executionId) {
    const execution = this.executionHistory.get(executionId);
    if (!execution) {
      return false;
    }

    try {
      // 尝试停止所有可能的执行器
      await Promise.all([
        this.executors.process.stop(executionId),
        this.executors.worker.stop(executionId)
      ]);

      this._updateExecutionStatus(executionId, 'stopped');
      return true;
    } catch (error) {
      log(`[Sandbox] 停止执行失败: ${error.message}`, 'ERROR');
      return false;
    }
  }

  /**
   * 获取执行状态
   * @param {string} executionId 执行ID
   * @returns {Object|null}
   */
  getExecutionStatus(executionId) {
    return this.executionHistory.get(executionId) || null;
  }

  /**
   * 清理过期的执行记录
   * @param {number} days 天数
   */
  cleanupExpiredExecutions(days = 1) {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    let removed = 0;

    for (const [executionId, execution] of this.executionHistory.entries()) {
      if (execution.startTime < cutoffTime) {
        this.executionHistory.delete(executionId);
        removed++;
      }
    }

    if (removed > 0) {
      log(`[Sandbox] 清理了 ${removed} 个过期执行记录`, 'INFO');
    }
  }

  /**
   * 关闭沙盒管理器
   */
  async close() {
    try {
      await Promise.all([
        this.executors.process.close(),
        this.executors.worker.close()
      ]);
      log('[Sandbox] 沙盒管理器已关闭', 'INFO');
    } catch (error) {
      log(`[Sandbox] 关闭沙盒管理器失败: ${error.message}`, 'ERROR');
    }
  }

  /**
   * 更新执行状态
   * @private
   */
  _updateExecutionStatus(executionId, status, result = null) {
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
