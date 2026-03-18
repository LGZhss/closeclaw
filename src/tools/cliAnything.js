/**
 * CLI-Anything Tool Adapter for AgentOS
 * 
 * 集成 https://github.com/HKUDS/CLI-Anything 工具
 * 提供命令行界面交互能力，支持自然语言到CLI命令的转换
 */

import path from 'path';
import fs from 'fs/promises';
import { log } from '../../utils/logger.js';
import { resolveSafePath } from '../../config/config.js';
import { sandboxManager } from '../sandbox/sandboxManager.js';

/**
 * CLI-Anything 工具处理器
 */
export async function cliAnything(args) {
  const { prompt, workingDir = '.', timeout = 30000 } = args;
  
  try {
    // 安全路径解析
    const safeDir = resolveSafePath(workingDir);
    
    // 验证工作目录存在
    try {
      await fs.access(safeDir);
    } catch (error) {
      return {
        success: false,
        error: `工作目录不存在: ${safeDir}`,
        output: ''
      };
    }

    log(`[CLI-Anything] 执行命令: ${prompt} 在目录: ${safeDir}`, 'INFO');
    
    // 这里应该调用CLI-Anything的API或CLI
    // 目前先实现基本的命令执行框架
    const result = await executeCliAnything(prompt, safeDir, timeout);
    
    return {
      success: true,
      output: result.stdout,
      error: result.stderr,
      workingDir: safeDir
    };
    
  } catch (error) {
    log(`[CLI-Anything] 执行失败: ${error.message}`, 'ERROR');
    return {
      success: false,
      error: error.message,
      output: ''
    };
  }
}

/**
 * 执行CLI-Anything命令
 * @param {string} prompt 自然语言提示
 * @param {string} workDir 工作目录
 * @param {number} timeout 超时时间
 * @returns {Promise} 执行结果
 */
async function executeCliAnything(prompt, workDir, timeout) {
  // TODO: 这里需要集成实际的CLI-Anything工具
  // 可能的集成方式：
  // 1. 调用CLI-Anything的REST API
  // 2. 使用CLI-Anything的CLI工具
  // 3. 直接集成其核心逻辑
  
  // 临时实现：基本的命令执行
  // 在实际集成中，这里应该调用CLI-Anything来转换自然语言为具体命令
  
  const fallbackCommands = {
    'list files': 'ls -la',
    'show directory': 'pwd',
    'create directory': 'mkdir',
    'remove file': 'rm',
    'copy file': 'cp',
    'move file': 'mv'
  };
  
  // 简单的关键词匹配（实际应该使用CLI-Anything的智能转换）
  let command = prompt;
  for (const [key, cmd] of Object.entries(fallbackCommands)) {
    if (prompt.toLowerCase().includes(key)) {
      command = cmd;
      break;
    }
  }
  
  // 安全检查：禁止危险命令
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
  
  // 执行命令 - 使用沙盒管理器进行隔离执行
  const result = await sandboxManager.executeCommand(command, {
    cwd: workDir,
    timeout
  });
  
  return result;
}

/**
 * CLI-Anything工具定义
 */
export const cliAnythingTool = {
  name: 'cli_anything',
  description: '使用自然语言执行命令行操作，基于CLI-Anything工具',
  aliases: ['/cli', '/command'],
  category: 'system',
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: '自然语言命令描述，如"列出当前目录的文件"'
      },
      workingDir: {
        type: 'string',
        description: '工作目录（相对于workspace）',
        default: '.'
      },
      timeout: {
        type: 'number',
        description: '命令超时时间（毫秒）',
        default: 30000
      }
    },
    required: ['prompt']
  },
  handler: 'cliAnything',
  noContext: false
};
