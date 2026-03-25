import fs from "fs/promises";
import path from "path";
import { spawn, exec } from "child_process";
import { logger } from "../logger.js";

/** 工作区目录，默认当前目录 */
export const WORKSPACE = process.cwd();

/**
 * 执行系统命令（PowerShell 风格）
 */
export async function executeSystemCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const cmd = process.platform === "win32" ? "powershell.exe" : "/bin/sh";
    const args =
      process.platform === "win32" ? ["-Command", command] : ["-c", command];

    const child = spawn(cmd, args, { stdio: "pipe" });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => (stdout += data.toString()));
    child.stderr.on("data", (data) => (stderr += data.toString()));

    child.on("close", (code) => {
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
export async function execAsync(
  command: string,
): Promise<{ stdout: string; stderr: string }> {
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
  const fullPath = resolveSafePath(filePath);
  try {
    return await fs.readFile(fullPath, "utf8");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error reading ${filePath}: ${message}`);
    throw error;
  }
}

/**
 * 写入工作区文件
 */
export async function writeWsFile(
  filePath: string,
  content: string,
): Promise<string> {
  const fullPath = resolveSafePath(filePath);
  try {
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content, "utf8");
    return "OK";
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
export async function runGit(
  action: "backup" | "sync",
  message?: string,
): Promise<string> {
  try {
    if (action === "backup") {
      const msg = message || `Backup at ${new Date().toISOString()}`;
      // 使用 spawn 直接调用 git，不经过 shell
      return new Promise((resolve) => {
        const add = spawn("git", ["add", "."], { cwd: WORKSPACE });
        add.on("close", (code) => {
          if (code !== 0) return resolve("❌ git add failed");
          const commit = spawn("git", ["commit", "-m", msg], {
            cwd: WORKSPACE,
          });
          commit.on("close", (c) => {
            if (c === 0) resolve("✅ Backup successful");
            else resolve(`❌ git commit failed (code ${c})`);
          });
        });
      });
    } else {
      return new Promise((resolve) => {
        const pull = spawn("git", ["pull"], { cwd: WORKSPACE });
        pull.on("close", (code) => {
          if (code !== 0) return resolve("❌ git pull failed");
          const push = spawn("git", ["push"], { cwd: WORKSPACE });
          push.on("close", (c) => {
            if (c === 0) resolve("✅ Sync successful");
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
export function resolveSafePath(userPath: string): string {
  try {
    const resolvedPath = path.resolve(WORKSPACE, userPath);
    // 物理还原真实路径 (处理符号链接绕过)
    const realWorkspace = path.resolve(fs.realpathSync.native(WORKSPACE));
    const realTarget = path.resolve(fs.realpathSync.native(resolvedPath));

    if (!realTarget.startsWith(realWorkspace)) {
      throw new Error(`Access denied: path is outside workspace (${userPath})`);
    }
    return realTarget;
  } catch (err: unknown) {
    // 如果文件尚不存在，fs.realpathSync 可能抛错，此时回退到基础路径校验
    const resolvedPath = path.resolve(WORKSPACE, userPath);
    if (!resolvedPath.startsWith(WORKSPACE)) {
       throw new Error(`Access denied: path is outside workspace (${userPath})`);
    }
    return resolvedPath;
  }
}
