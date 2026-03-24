import fs from 'fs/promises';
import path from 'path';
import { spawn, exec } from 'child_process';
import { logger } from '../logger.js';

/** 工作区目录，默认当前目录 */
export const WORKSPACE = process.cwd();

/**
 * 执行系统命令（PowerShell 风格）
 */
export async function executeSystemCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const cmd = process.platform === 'win32' ? 'powershell.exe' : '/bin/sh';
    const args = process.platform === 'win32' ? ['-Command', command] : ['-c', command];

    const child = spawn(cmd, args, { stdio: 'pipe' });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => (stdout += data.toString()));
    child.stderr.on('data', (data) => (stderr += data.toString()));

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `Command failed with code ${code}`));
      }
    });
  });
}

/**
 * 异步执行命令
 */
export async function execAsync(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * 读取工作区文件
 */
export async function readWsFile(filePath: string): Promise<string> {
  const fullPath = path.resolve(WORKSPACE, filePath);
  try {
    return await fs.readFile(fullPath, 'utf8');
  } catch (error: any) {
    logger.error(`Error reading ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * 写入工作区文件
 */
export async function writeWsFile(filePath: string, content: string): Promise<string> {
  const fullPath = path.resolve(WORKSPACE, filePath);
  try {
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content, 'utf8');
    return 'OK';
  } catch (error: any) {
    logger.error(`Error writing ${filePath}: ${error.message}`);
    return error.message;
  }
}

/**
 * 抓取 URL 内容
 */
export async function fetchUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (error: any) {
    logger.error(`Fetch error ${url}: ${error.message}`);
    throw error;
  }
}

/**
 * 执行 Git 操作
 */
export async function runGit(action: 'backup' | 'sync', message?: string): Promise<string> {
  try {
    if (action === 'backup') {
      const msg = message || `Backup at ${new Date().toISOString()}`;
      await executeSystemCommand(`git add . && git commit -m "${msg}"`);
      return '✅ Backup successful';
    } else {
      await executeSystemCommand(`git pull && git push`);
      return '✅ Sync successful';
    }
  } catch (error: any) {
    logger.error(`Git error: ${error.message}`);
    return `❌ Git failed: ${error.message}`;
  }
}

/**
 * 安全路径解析，防止目录穿越
 */
export function resolveSafePath(userPath: string): string {
  const resolvedPath = path.resolve(WORKSPACE, userPath);
  if (!resolvedPath.startsWith(WORKSPACE)) {
    throw new Error(`Access denied: path is outside workspace (${userPath})`);
  }
  return resolvedPath;
}

