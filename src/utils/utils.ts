/**
 * 核心工具类
 * 提供文件系统安全访问、路径校验、Git 操作等基础能力
 */

import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { execSync, spawn } from "child_process";
import { logger } from "../logger.js";

/** 核心加固 (P031): 敏感文件名黑名单，防止 Agent 越权读取 */
const PROTECTED_FILES = [
  ".env",
  "config.json",
  ".subjects.json",
  "dropstone_memory.db",
];

/** 核心加固 (P031): 敏感目录路径黑名单，防止 Agent 越权读取 (Bug B2.2 修复) */
const PROTECTED_PATHS = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".git",
  "node_modules",
  ".kiro/settings",
  ".dropstone",
  ".subjects.json",
  "config.json",
  "dropstone_memory.db",
];

/**
 * 等待指定时间
 * @param ms 毫秒数
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 将 JID 转换为文件系统安全的名称
 * @param jid 原始 JID
 * @returns 安全的名称
 */
export const sanitizeJid = (jid: string): string => {
  return jid.replace(/[:@.]/g, "_");
};

/**
 * 递归创建目录
 * @param dirPath 目录路径
 */
export const ensureDir = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * 递归创建目录 (异步)
 * @param dirPath 目录路径
 */
export const ensureDirAsync = async (dirPath: string): Promise<void> => {
  if (!fs.existsSync(dirPath)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fsPromises.mkdir(dirPath, { recursive: true });
  }
};

/**
 * 校验并解析安全路径，防止目录穿越 (P031)
 * @param baseDir 基础目录
 * @param relativePath 相对路径
 * @returns 绝对路径
 */
export const resolveSafePath = (
  baseDir: string,
  relativePath: string,
): string => {
  const absoluteBase = path.resolve(baseDir);
  const targetPath = path.resolve(baseDir, relativePath);

  // 核心加固 (P031): 禁止目录穿越
  const relativeFromBase = path.relative(absoluteBase, targetPath);
  if (
    /^\.\.(?:[\\/]|$)/.test(relativeFromBase) ||
    path.isAbsolute(relativeFromBase)
  ) {
    throw new Error(`[Security] 拒绝越权访问路径: ${relativePath}`);
  }

  // 核心加固 (P031 Bug B2.2): 禁止访问敏感路径（目录和文件）
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\.\/+/, "");
  for (const protectedPath of PROTECTED_PATHS) {
    if (
      normalized === protectedPath ||
      normalized.startsWith(protectedPath + "/")
    ) {
      throw new Error(`[Security] 拒绝访问受保护路径: ${relativePath}`);
    }
  }

  // 核心加固 (P031): 禁止访问敏感文件（向后兼容）
  const fileName = path.basename(targetPath);
  if (PROTECTED_FILES.includes(fileName)) {
    throw new Error(`[Security] 拒绝访问核心敏感文件: ${fileName}`);
  }

  return targetPath;
};

/**
 * 读取工作空间文件 (Agent 专用，带安全校验)
 * @param workspaceDir 工作空间根目录
 * @param relativePath 相对路径
 */
export const readWsFile = (
  workspaceDir: string,
  relativePath: string,
): string => {
  const safePath = resolveSafePath(workspaceDir, relativePath);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!fs.existsSync(safePath)) {
    throw new Error(`文件不存在: ${relativePath}`);
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return fs.readFileSync(safePath, "utf-8");
};

/**
 * 读取工作空间文件 (Agent 专用，异步带安全校验)
 * @param workspaceDir 工作空间根目录
 * @param relativePath 相对路径
 */
export const readWsFileAsync = async (
  workspaceDir: string,
  relativePath: string,
): Promise<string> => {
  const safePath = resolveSafePath(workspaceDir, relativePath);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!fs.existsSync(safePath)) {
    throw new Error(`文件不存在: ${relativePath}`);
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return await fsPromises.readFile(safePath, "utf-8");
};

/**
 * 写入工作空间文件 (Agent 专用，带安全校验)
 * @param workspaceDir 工作空间根目录
 * @param relativePath 相对路径
 * @param content 内容
 */
export const writeWsFile = (
  workspaceDir: string,
  relativePath: string,
  content: string,
): void => {
  const safePath = resolveSafePath(workspaceDir, relativePath);
  ensureDir(path.dirname(safePath));
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.writeFileSync(safePath, content, "utf-8");
};

/**
 * 写入工作空间文件 (Agent 专用，异步带安全校验)
 * @param workspaceDir 工作空间根目录
 * @param relativePath 相对路径
 * @param content 内容
 */
export const writeWsFileAsync = async (
  workspaceDir: string,
  relativePath: string,
  content: string,
): Promise<void> => {
  const safePath = resolveSafePath(workspaceDir, relativePath);
  await ensureDirAsync(path.dirname(safePath));
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await fsPromises.writeFile(safePath, content, "utf-8");
};

/**
 * 安全执行系统命令 (P033 高性能增强)
 * 封装 execSync，增加日志审计和大小限制
 */
export const safeCmd = (
  command: string,
  options: { cwd?: string; maxBuffer?: number } = {},
): string => {
  try {
    const result = execSync(command, {
      cwd: options.cwd || process.cwd(),
      encoding: "utf-8",
      maxBuffer: options.maxBuffer || 1024 * 1024 * 2, // 默认 2MB
      stdio: ["ignore", "pipe", "pipe"],
    });
    return result.trim();
  } catch (error: any) {
    const stderr = error.stderr?.toString() || "";
    logger.warn(`[safeCmd] 执行失败: ${command}, 错误: ${stderr}`);
    throw new Error(stderr || error.message);
  }
};

/**
 * 安全执行系统命令 (异步)
 */
export const safeCmdAsync = async (
  command: string,
  options: { cwd?: string; timeout?: number } = {},
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> => {
  return new Promise((resolve) => {
    const { cwd = process.cwd(), timeout = 30000 } = options;

    let cmd: string;
    let args: string[];

    if (process.platform === "win32") {
      cmd = "cmd.exe";
      args = ["/c", command];
    } else {
      cmd = "/bin/sh";
      args = ["-c", command];
    }

    const cp = spawn(cmd, args, { cwd, timeout });
    let stdout = "";
    let stderr = "";

    cp.stdout?.on("data", (d) => (stdout += d.toString()));
    cp.stderr?.on("data", (d) => (stderr += d.toString()));

    cp.on("close", (code) => {
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: code });
    });

    cp.on("error", (err) => {
      resolve({ stdout: "", stderr: err.message, exitCode: 1 });
    });
  });
};

/**
 * 判断指定目录是否为 Git 仓库
 * @param dirPath 目录路径
 */
export const isGitRepo = (dirPath: string): boolean => {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: dirPath,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * 执行 Git 命令并捕获异常 (P033 重试机制)
 * @param args Git 参数数组
 * @param cwd 工作目录
 * @param retries 重试次数
 */
export const runGit = (args: string[], cwd: string, retries = 2): string => {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return execSync(`git ${args.join(" ")}`, {
        cwd,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim();
    } catch (error: any) {
      attempt++;
      const stderr = error.stderr?.toString() || "";
      if (attempt > retries) {
        logger.error(
          `[runGit] Git 命令失败 (尝试 ${attempt} 次): git ${args.join(" ")}, 错误: ${stderr}`,
        );
        throw new Error(stderr || "Git 执行失败");
      }
      logger.warn(`[runGit] Git 命令重试 (${attempt}/${retries}): ${args[0]}`);
    }
  }
  return "";
};

/**
 * 获取 Git 提交历史 (P033 优化)
 * @param cwd 目录
 * @param limit 限制数量
 */
export const getGitHistory = (cwd: string, limit = 5): string => {
  try {
    return runGit(["log", `-${limit}`, "--oneline"], cwd);
  } catch {
    return "无 Git 提交记录";
  }
};

/**
 * 计算文件大小
 */
export const getFileSize = (filePath: string): number => {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
};
