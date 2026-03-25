/**
 * 进程执行器
 * 使用子进程执行代码和命令，实现基线隔离
 */

import { spawn, ChildProcess } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";
import { logger } from "../logger.js";
import { config } from "../config.js";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export interface ExecutionOptions {
  timeout?: number;
  cwd?: string;
}

export class ProcessExecutor {
  private runningProcesses: Map<string, ChildProcess>;

  constructor() {
    this.runningProcesses = new Map();
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
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}_${process.hrtime.bigint()}`;
    const timeout = options.timeout || config.sandbox.timeout;

    // 创建临时JavaScript文件
    const tempFile = path.join(os.tmpdir(), `temp_${executionId}.js`);

    try {
      // 写入代码到临时文件 (使用异步 fs.promises.writeFile 避免阻塞 Node.js 事件循环)
      await fs.promises.writeFile(tempFile, code);

      // 安全地使用 spawn 执行 node 命令，而不是通过 shell
      const result = await this._executeProcess(
        "node",
        [tempFile],
        { timeout },
        executionId,
      );

      // 清理临时文件 (使用异步 fs.promises.unlink 避免阻塞 Node.js 事件循环)
      try {
        await fs.promises.unlink(tempFile);
      } catch (e) {
        // 忽略清理错误
      }

      return result;
    } catch (error) {
      // 清理临时文件 (使用异步 fs.promises.unlink 避免阻塞 Node.js 事件循环)
      try {
        await fs.promises.unlink(tempFile);
      } catch (e) {
        // 忽略清理错误
      }
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

    // 解析命令
    let cmd: string;
    let args: string[] = [];

    if (process.platform === "win32") {
      // Windows 平台
      cmd = "cmd.exe";
      args = ["/c", command];
    } else {
      // Unix 平台
      cmd = "/bin/sh";
      args = ["-c", command];
    }

    return this._executeProcess(cmd, args, options, executionId, command);
  }

  /**
   * 底层进程执行抽象，安全地传递参数
   * @private
   */
  private _executeProcess(
    cmd: string,
    args: string[],
    options: ExecutionOptions,
    executionId: string | null = null,
    originalCommand: string = "",
  ): Promise<ExecutionResult> {
    if (!executionId) {
      executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
    const timeout = options.timeout || config.sandbox.timeout;
    const cwd = options.cwd || process.cwd();
    const displayCmd = originalCommand || `${cmd} ${args.join(" ")}`;

    return new Promise((resolve, reject) => {
      let stdout = "";
      let stderr = "";
      let timeoutId: NodeJS.Timeout | null = null;

      // 启动子进程
      const childProcess = spawn(cmd, args, {
        cwd,
        env: {
          // 限制环境变量，防止泄露敏感信息
          NODE_ENV: "production",
          PATH: process.env.PATH,
        },
        stdio: "pipe",
      });

      // 记录运行中的进程
      this.runningProcesses.set(executionId!, childProcess);

      // 设置超时
      if (timeout) {
        timeoutId = setTimeout(() => {
          childProcess.kill();
          reject(new Error(`命令执行超时: ${timeout}ms`));
        }, timeout);
      }

      // 捕获标准输出
      childProcess.stdout!.on("data", (data) => {
        stdout += data.toString();
      });

      // 捕获标准错误
      childProcess.stderr!.on("data", (data) => {
        stderr += data.toString();
      });

      // 进程结束
      childProcess.on("close", (exitCode) => {
        // 清除超时
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // 移除进程记录
        this.runningProcesses.delete(executionId!);

        // 解析结果
        const result: ExecutionResult = {
          stdout,
          stderr,
          exitCode,
        };

        logger.debug(
          `[ProcessExecutor] 命令执行完成: ${displayCmd}，退出码: ${exitCode}`,
        );
        resolve(result);
      });

      // 进程错误
      childProcess.on("error", (error) => {
        // 清除超时
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // 移除进程记录
        this.runningProcesses.delete(executionId!);

        // 补齐：在进程错误时也尝试清理临时文件 (Item 8)
        const argsStr = args.join(" ");
        if (argsStr.includes("temp_exec_")) {
          const tempPath = args.find((a) => a.includes("temp_exec_"));
          if (tempPath) {
            // 使用异步 fs.promises.unlink 并 catch 错误以避免阻塞 Node.js 事件循环
            fs.promises.unlink(tempPath).catch(() => {});
          }
        }

        logger.error(`[ProcessExecutor] 命令执行错误: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * 停止执行
   * @param executionId 执行ID
   * @returns 是否成功停止
   */
  async stop(executionId: string): Promise<boolean> {
    const childProcess = this.runningProcesses.get(executionId);
    if (!childProcess) {
      return false;
    }

    try {
      childProcess.kill();
      this.runningProcesses.delete(executionId);
      logger.info(`[ProcessExecutor] 已停止执行: ${executionId}`);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[ProcessExecutor] 停止执行失败: ${message}`);
      return false;
    }
  }

  /**
   * 关闭执行器
   */
  async close(): Promise<void> {
    // 停止所有运行中的进程
    for (const [executionId, childProcess] of this.runningProcesses.entries()) {
      try {
        childProcess.kill();
        logger.info(`[ProcessExecutor] 关闭时停止执行: ${executionId}`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[ProcessExecutor] 关闭时停止执行失败: ${message}`);
      }
    }

    this.runningProcesses.clear();
    logger.info("[ProcessExecutor] 执行器已关闭");
  }

  /**
   * 获取运行中的进程数量
   * @returns 进程数量
   */
  getRunningProcessesCount(): number {
    return this.runningProcesses.size;
  }
}
