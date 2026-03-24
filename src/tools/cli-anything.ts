/**
 * CLI-Anything Tool Adapter for AgentOS
 */

import { logger } from '../logger.js';
import { resolveSafePath } from '../utils/utils.js';
import { sandboxManager } from '../sandbox/manager.js';

export interface CliAnythingArgs {
  prompt: string;
  workingDir?: string;
  timeout?: number;
}

export interface CliAnythingResult {
  success: boolean;
  output: string;
  error?: string;
  workingDir?: string;
}

/**
 * CLI-Anything 工具处理器
 */
export async function cliAnything(args: CliAnythingArgs): Promise<CliAnythingResult> {
  const { prompt, workingDir = '.', timeout = 30000 } = args;
  
  try {
    const safeDir = resolveSafePath(workingDir);
    
    logger.info(`[CLI-Anything] 执行命令: ${prompt} 在目录: ${safeDir}`);
    
    const result = await executeCliAnything(prompt, safeDir, timeout);
    
    return {
      success: true,
      output: result.stdout,
      error: result.stderr,
      workingDir: safeDir
    };
    
  } catch (error: any) {
    logger.error(`[CLI-Anything] 执行失败: ${error.message}`);
    return {
      success: false,
      error: error.message,
      output: ''
    };
  }
}

/**
 * 执行 CLI-Anything 命令 (当前为安全过滤后的备选实现)
 */
async function executeCliAnything(prompt: string, workDir: string, timeout: number) {
  const fallbackCommands: Record<string, string> = {
    'list files': 'ls -la',
    'show directory': 'pwd',
    'create directory': 'mkdir',
    'remove file': 'rm',
    'copy file': 'cp',
    'move file': 'mv'
  };
  
  let command = prompt;
  for (const [key, cmd] of Object.entries(fallbackCommands)) {
    if (prompt.toLowerCase().includes(key)) {
      command = cmd;
      break;
    }
  }

  const baseCommand = command.trim().split(/\s+/)[0];

  if (/[;&|`<>$]/.test(command)) {
    throw new Error(`检测到非法的 shell 元字符: ${command}`);
  }

  const allowedCommands = new Set([
    'ls', 'pwd', 'mkdir', 'rm', 'cp', 'mv',
    'echo', 'cat', 'touch', 'grep', 'find'
  ]);

  if (!allowedCommands.has(baseCommand)) {
    throw new Error(`命令不在白名单中: ${baseCommand}`);
  }
  
  const dangerousPatterns = [
    /rm\s+-rf\s+\//,
    /format/,
    /del\s+\/s/,
    /shutdown/,
    /reboot/
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      throw new Error(`检测到危险命令: ${command}`);
    }
  }
  
  return await sandboxManager.executeCommand(command, {
    cwd: workDir,
    timeout
  });
}
