import fsPromises from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
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

    const child: any = spawn(cmd, args, { stdio: 'pipe' });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => (stdout += data.toString()));
    child.stderr.on('data', (data: Buffer) => (stderr += data.toString()));

    child.on('close', (code: number | null) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `Command failed with code ${code}`));
      }
    });
  });
}

/**
 * 异步执行命令（安全防注入版本）
 */
export async function execAsync(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    // 简单解析命令和参数（支持双引号包裹的参数）
    const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    if (parts.length === 0) {
      return reject(new Error('Empty command'));
    }

    const executable = parts[0] as string;
    const args = parts.slice(1).map(arg => arg.replace(/^"|"$/g, ''));

    // nosemgrep
    const child: any = spawn(executable, args, { stdio: 'pipe', shell: false });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => (stdout += data.toString()));
    child.stderr.on('data', (data: Buffer) => (stderr += data.toString()));

    child.on('close', (code: number | null) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const error: any = new Error(stderr || `Process exited with code ${code}`);
        error.code = code;
        error.cmd = command;
        reject(error);
      }
    });

    child.on('error', (error: any) => {
      reject(error);
    });
  });
}

/**
 * 读取工作区文件
 */
export async function readWsFile(filePath: string): Promise<string> {
  const fullPath = resolveSafePath(filePath);
  try {
    return await fsPromises.readFile(fullPath, 'utf8');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error reading ${filePath}: ${message}`);
    throw error;
  }
}

/**
 * 写入工作区文件
 */
export async function writeWsFile(filePath: string, content: string): Promise<string> {
  const fullPath = resolveSafePath(filePath);
  try {
    const dir = path.dirname(fullPath);
    await fsPromises.mkdir(dir, { recursive: true });
    await fsPromises.writeFile(fullPath, content, 'utf8');
    return 'OK';
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error writing ${filePath}: ${message}`);
    return message;
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Fetch error ${url}: ${message}`);
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
      // 使用 spawn 直接调用 git，不经过 shell
      return new Promise((resolve) => {
        const add = spawn('git', ['add', '.'], { cwd: WORKSPACE });
        add.on('close', (code) => {
          if (code !== 0) return resolve('❌ git add failed');
          const commit = spawn('git', ['commit', '-m', msg], { cwd: WORKSPACE });
          commit.on('close', (c) => {
            if (c === 0) resolve('✅ Backup successful');
            else resolve(`❌ git commit failed (code ${c})`);
          });
        });
      });
    } else {
      return new Promise((resolve) => {
        const pull = spawn('git', ['pull'], { cwd: WORKSPACE });
        pull.on('close', (code) => {
          if (code !== 0) return resolve('❌ git pull failed');
          const push = spawn('git', ['push'], { cwd: WORKSPACE });
          push.on('close', (c) => {
            if (c === 0) resolve('✅ Sync successful');
            else resolve(`❌ git push failed (code ${c})`);
          });
        });
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Git error: ${message}`);
    return `❌ Git failed: ${message}`;
  }
}

/**
 * 安全路径解析，防止目录穿越 (Item 10 加固)
 */
function isPathInside(target: string, parent: string): boolean {
  if (target === parent) return true;
  const safeParent = parent.endsWith(path.sep) ? parent : parent + path.sep;
  return target.startsWith(safeParent);
}

export function resolveSafePath(userPath: string): string {
  try {
    const resolvedPath = path.resolve(WORKSPACE, userPath);
    // 物理还原真实路径 (处理符号链接绕过)
    const realWorkspace = path.resolve(fs.realpathSync.native(WORKSPACE));
    const realTarget = path.resolve(fs.realpathSync.native(resolvedPath));

    if (!isPathInside(realTarget, realWorkspace)) {
      throw new Error(`Access denied: path is outside workspace (${userPath})`);
    }
    return realTarget;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith('Access denied')) {
      throw err;
    }
    // 如果文件尚不存在，fs.realpathSync 可能抛错，此时回退到基础路径校验
    const resolvedPath = path.resolve(WORKSPACE, userPath);
    if (!isPathInside(resolvedPath, WORKSPACE)) {
       throw new Error(`Access denied: path is outside workspace (${userPath})`);
    }
    return resolvedPath;
  }
}
