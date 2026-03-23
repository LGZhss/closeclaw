/**
 * 进程执行器
 * 使用子进程执行代码和命令，实现基线隔离
 */

import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import { log } from '../utils/logger.js';
import { config } from '../config/config.js';

export class ProcessExecutor {
  constructor() {
    this.runningProcesses = new Map();
  }

  /**
   * 执行代码
   * @param {string} code 要执行的代码
   * @param {Object} options 执行选项
   * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
   */
  async execute(code, options = {}) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timeout = options.timeout || config.sandbox.timeout;

    return new Promise((resolve, reject) => {
      // 创建临时JavaScript文件
      const tempFile = path.join(os.tmpdir(), `temp_${executionId}.js`);
      const fs = require('fs');
      
      try {
        // 写入代码到临时文件
        fs.writeFileSync(tempFile, code);

        // 安全地使用 spawn 执行 node 命令，而不是通过 shell
        this._executeProcess('node', [tempFile], { timeout }, executionId).then(result => {
          // 清理临时文件
          try {
            fs.unlinkSync(tempFile);
          } catch (e) {
            // 忽略清理错误
          }
          resolve(result);
        }).catch(error => {
          // 清理临时文件
          try {
            fs.unlinkSync(tempFile);
          } catch (e) {
            // 忽略清理错误
          }
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 执行命令
   * @param {string} command 要执行的命令
   * @param {Object} options 执行选项
   * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
   */
  async executeCommand(command, options = {}) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 解析命令
    let cmd = command;
    let args = [];

    if (process.platform === 'win32') {
      // Windows 平台
      cmd = 'cmd.exe';
      args = ['/c', command];
    } else {
      // Unix 平台
      cmd = '/bin/sh';
      args = ['-c', command];
    }

    return this._executeProcess(cmd, args, options, executionId, command);
  }

  /**
   * 底层进程执行抽象，安全地传递参数
   * @private
   */
  _executeProcess(cmd, args, options, executionId = null, originalCommand = '') {
    if (!executionId) {
      executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    const timeout = options.timeout || config.sandbox.timeout;
    const cwd = options.cwd || process.cwd();
    const displayCmd = originalCommand || `${cmd} ${args.join(' ')}`;

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let timeoutId = null;

      // 启动子进程
      const process = spawn(cmd, args, {
        cwd,
        env: {
          // 限制环境变量，防止泄露敏感信息
          NODE_ENV: 'production',
          PATH: process.env.PATH
        },
        stdio: 'pipe'
      });

      // 记录运行中的进程
      this.runningProcesses.set(executionId, process);

      // 设置超时
      if (timeout) {
        timeoutId = setTimeout(() => {
          process.kill();
          reject(new Error(`命令执行超时: ${timeout}ms`));
        }, timeout);
      }

      // 捕获标准输出
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // 捕获标准错误
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // 进程结束
      process.on('close', (exitCode) => {
        // 清除超时
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // 移除进程记录
        this.runningProcesses.delete(executionId);

        // 解析结果
        const result = {
          stdout,
          stderr,
          exitCode
        };

        log(`[ProcessExecutor] 命令执行完成: ${displayCmd}，退出码: ${exitCode}`, 'DEBUG');
        resolve(result);
      });

      // 进程错误
      process.on('error', (error) => {
        // 清除超时
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // 移除进程记录
        this.runningProcesses.delete(executionId);

        log(`[ProcessExecutor] 命令执行错误: ${error.message}`, 'ERROR');
        reject(error);
      });
    });
  }

  /**
   * 停止执行
   * @param {string} executionId 执行ID
   * @returns {Promise<boolean>}
   */
  async stop(executionId) {
    const process = this.runningProcesses.get(executionId);
    if (!process) {
      return false;
    }

    try {
      process.kill();
      this.runningProcesses.delete(executionId);
      log(`[ProcessExecutor] 已停止执行: ${executionId}`, 'INFO');
      return true;
    } catch (error) {
      log(`[ProcessExecutor] 停止执行失败: ${error.message}`, 'ERROR');
      return false;
    }
  }

  /**
   * 关闭执行器
   */
  async close() {
    // 停止所有运行中的进程
    for (const [executionId, process] of this.runningProcesses.entries()) {
      try {
        process.kill();
        log(`[ProcessExecutor] 关闭时停止执行: ${executionId}`, 'INFO');
      } catch (error) {
        log(`[ProcessExecutor] 关闭时停止执行失败: ${error.message}`, 'ERROR');
      }
    }

    this.runningProcesses.clear();
    log('[ProcessExecutor] 执行器已关闭', 'INFO');
  }

  /**
   * 获取运行中的进程数量
   * @returns {number}
   */
  getRunningProcessesCount() {
    return this.runningProcesses.size;
  }
}
