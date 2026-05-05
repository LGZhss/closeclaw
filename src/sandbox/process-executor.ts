/**
 * 进程执行器
 * 使用子进程执行代码和命令，实现基线隔离
 */

import { spawn, ChildProcess } from "child_process";
import crypto from "crypto";
import os from "os";
import path from "path";
import fsPromises from "fs/promises";
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

/** 沙盒代码最大允许大小 */
const MAX_CODE_SIZE = 10_240; // 10KB

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
    if (code.length > MAX_CODE_SIZE) {
      throw new Error(
        `Code too large: ${code.length} bytes (max ${MAX_CODE_SIZE})`,
      );
    }

    const executionId = `exec_${Date.now()}_${crypto.randomBytes(8).toString("hex")}_${process.hrtime.bigint()}`;
    const timeout = options.timeout || config.sandbox.timeout;
    const tempFile = path.join(os.tmpdir(), `temp_${executionId}.js`);

    try {
      // 写入代码到临时文件，使用异步操作避免阻塞事件循环 (P033 优化)
      // What: Set explicit restrictive file permissions (0o600) on temporary files.
      // Why: os.tmpdir() is a shared directory. Default permissions may allow other users to read or modify the code before it is executed, leading to a TOCTOU vulnerability.
      // Impact: Significantly reduces the risk of sandbox code tampering or leakage on multi-user systems.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fsPromises.writeFile(tempFile, code, { mode: 0o600 });

      // 安全地使用 spawn 执行 node 命令
      return await this._executeProcess(
        "node",
        [tempFile],
        { timeout },
        executionId,
        "",
        tempFile,
      );
    } catch (error) {
      logger.error(
        `[ProcessExecutor] 执行失败: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    } finally {
      // 核心加固 (P031): 使用 finally 确保即使在 _executeProcess 抛错时也会清理
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        await fsPromises.unlink(tempFile);
      } catch (error: unknown) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code !== "ENOENT") {
          logger.warn(`[ProcessExecutor] 清理临时文件失败: ${tempFile}`);
        }
      }
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
    const executionId = `exec_${Date.now()}_${crypto.randomBytes(8).toString("hex")}_${process.hrtime.bigint()}`;

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
    tempFilePath: string | null = null,
  ): Promise<ExecutionResult> {
    if (!executionId) {
      executionId = `exec_${Date.now()}_${crypto.randomBytes(8).toString("hex")}_${process.hrtime.bigint()}`;
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

        const safeCmd =
          displayCmd.length > 50 ? displayCmd.slice(0, 50) + "..." : displayCmd;
        logger.debug(
          `[ProcessExecutor] 命令执行完成: ${safeCmd}，退出码: ${exitCode}`,
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

        // 补齐 (P031): 在进程错误时也尝试清理临时文件
        if (tempFilePath) {
          // 使用异步 unlink 优化 (P033)
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          fsPromises.unlink(tempFilePath).catch((error: unknown) => {
            const nodeError = error as NodeJS.ErrnoException;
            if (nodeError.code !== "ENOENT") {
              logger.debug(
                `Failed to cleanup temp file: ${tempFilePath} (${String(error)})`,
              );
            }
          });
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
