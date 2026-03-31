/**
 * 工具注册表
 * 将工具名称映射到具体的执行逻辑
 */

import { readWsFile, writeWsFile, safeCmd } from "../utils/utils.js";
import { SandboxManager } from "../sandbox/manager.js";

/** 工具处理函数类型 */
export type ToolHandler = (args: any, context: any) => Promise<any>;

/**
 * 初始化工具注册表
 * @param sandboxManager 沙盒管理器实例
 * @param workspaceDir 工作空间目录
 */
export const createToolRegistry = (
  sandboxManager: SandboxManager,
  workspaceDir: string,
): Record<string, ToolHandler> => {
  return {
    /** 读取文件处理器 */
    read_file: async ({ path: filePath }) => {
      return { content: readWsFile(workspaceDir, filePath) };
    },

    /** 写入文件处理器 */
    write_file: async ({ path: filePath, content }) => {
      writeWsFile(workspaceDir, filePath, content);
      return { success: true };
    },

    /** 在沙盒中执行代码处理器 */
    execute_code: async ({ code }, { traceId }) => {
      return await sandboxManager.run({ type: "code", content: code }, traceId);
    },

    /** 列出目录处理器 */
    list_dir: async ({ path: dirPath }) => {
      // 简单模拟，实际应用中应使用更复杂的逻辑
      return { files: ["."] };
    },

    /** 搜索 Web 处理器 (需对接外部 API) */
    search_web: async ({ query }) => {
      return { results: `Searching for: ${query}... (API not configured)` };
    },
  };
};
