import fsPromises from "fs/promises";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { logger } from "../logger.js";

/** 工作区目录，默认当前目录 */
export const WORKSPACE = process.cwd();

/**
 * 读取工作区文件
 */
export async function readWsFile(filePath: string): Promise<string> {
  const fullPath = resolveSafePath(filePath);
  const normalized = path.relative(WORKSPACE, fullPath).replace(/\\/g, "/");

  for (const protectedPath of PROTECTED_PATHS) {
    if (
      normalized === protectedPath ||
      normalized.startsWith(protectedPath + "/")
    ) {
      throw new Error(`Access denied: ${filePath} is a protected path`);
    }
  }

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return await fsPromises.readFile(fullPath, "utf8");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error reading ${filePath}: ${message}`);
    throw error;
  }
}

/**
 * 受保护的路径列表 — 禁止通过工具写入
 */
const PROTECTED_PATHS = [
  ".git",
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  ".gitignore",
  ".gitattributes",
  ".npmrc",
  "node_modules",
];

/**
 * 写入工作区文件
 */
export async function writeWsFile(
  filePath: string,
  content: string,
): Promise<string> {
  const fullPath = resolveSafePath(filePath);
  const normalized = path.relative(WORKSPACE, fullPath).replace(/\\/g, "/");

  for (const protectedPath of PROTECTED_PATHS) {
    if (
      normalized === protectedPath ||
      normalized.startsWith(protectedPath + "/")
    ) {
      return `Access denied: ${filePath} is a protected path`;
    }
  }

  try {
    const dir = path.dirname(fullPath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fsPromises.mkdir(dir, { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fsPromises.writeFile(fullPath, content, "utf8");
    return "OK";
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error writing ${filePath}: ${message}`);
    return message;
  }
}

/**
 * 抓取 URL 内容（含 SSRF 防护）
 */
const BLOCKED_HOSTNAME_PATTERNS = [
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^localhost$/i,
  /^\[::1\]$/,
];

const MAX_FETCH_SIZE = 1_048_576; // 1MB

export async function fetchUrl(url: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`URL scheme not allowed: ${parsed.protocol}`);
  }

  if (BLOCKED_HOSTNAME_PATTERNS.some((p) => p.test(parsed.hostname))) {
    throw new Error(
      `Access to private/internal network is blocked: ${parsed.hostname}`,
    );
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_FETCH_SIZE) {
      throw new Error("Response too large (max 1MB)");
    }

    const text = await response.text();
    if (text.length > MAX_FETCH_SIZE) {
      throw new Error("Response body too large (max 1MB)");
    }
    return text;
  } catch (error: unknown) {
    if (error instanceof TypeError) {
      throw new Error(`Fetch failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 执行 Git 操作 (引入 Renovate 风格的自动重试机制)
 */
export async function runGit(
  action: "backup" | "sync",
  message?: string,
  retries = 3,
): Promise<string> {
  const attempt = async (count: number): Promise<string> => {
    try {
      if (action === "backup") {
        const msg = message || `Backup at ${new Date().toISOString()}`;
        return await new Promise((resolve) => {
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
        return await new Promise((resolve) => {
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
      if (count > 0) {
        const delay = (4 - count) * 2000;
        logger.warn(
          `Git operation failed, retrying in ${delay}ms... (${count} retries left)`,
        );
        await new Promise((r) => setTimeout(r, delay));
        return attempt(count - 1);
      }
      const errMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Git error after retries: ${errMessage}`);
      return `❌ Git failed: ${errMessage}`;
    }
  };

  return attempt(retries);
}

/**
 * 安全路径解析，防止目录穿越 (Item 10 加固)
 * 采用 Deno 风格的 "Partial Canonicalization" 模式：
 * 1. 尝试对完整路径进行物理还原。
 * 2. 如果文件不存在，则递归向上寻找已存在的父目录进行物理还原，再拼接剩余部分。
 * 3. 最终校验物理路径是否在工作区内。
 */
export function resolveSafePath(userPath: string): string {
  const workspaceRoot = path.resolve(WORKSPACE);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const realWorkspace = fs.realpathSync.native(workspaceRoot);

  const getRealCapture = (p: string): string => {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return fs.realpathSync.native(p);
    } catch {
      const parent = path.dirname(p);
      if (parent === p) return p; // 已到达根目录
      const realParent = getRealCapture(parent);
      return path.join(realParent, path.basename(p));
    }
  };

  const resolvedPath = path.resolve(workspaceRoot, userPath);
  const realTarget = getRealCapture(resolvedPath);

  if (!isPathInside(realTarget, realWorkspace)) {
    throw new Error(`Access denied: path is outside workspace (${userPath})`);
  }

  return realTarget;
}

function isPathInside(target: string, parent: string): boolean {
  const relative = path.relative(parent, target);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}
