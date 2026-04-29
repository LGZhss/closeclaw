/**
 * 工具注册表
 * 将工具名称映射到具体的执行逻辑
 */

import { readWsFileAsync, writeWsFileAsync } from "../utils/utils.js";
import { SandboxManager } from "../sandbox/manager.js";
import {
  ToolArguments,
  ToolContext,
  ToolDefinition,
} from "./tool-definitions.js";

/** 工具处理函数类型 */
export type ToolHandler = (
  args: ToolArguments,
  context: ToolContext,
) => Promise<unknown>;

/**
 * 解析命令行风格的参数到对象
 * 支持特殊处理带空格的文件名
 * @param tool 工具定义
 * @param args 参数数组
 * @param rawText 原始命令文本
 * @returns 解析后的参数对象
 */
export function parseArgsToObject(
  tool: ToolDefinition,
  args: string[],
  rawText: string,
): ToolArguments {
  const props = tool.parameters?.properties || {};
  const propNames = Object.keys(props);

  // 特殊处理 write_file: /write <filename> <content>
  if (tool.name === "write_file") {
    const match = rawText.match(/^\/write\s+(\S+)\s+([\s\S]*)$/i);
    if (match) {
      return { path: match[1], content: match[2] };
    }
  }

  // 特殊处理 read_file: /read <filename with spaces>
  if (tool.name === "read_file") {
    const match = rawText.match(/^\/read\s+([\s\S]*)$/i);
    if (match) {
      return { path: match[1].trim() };
    }
  }

  // 默认处理：按位置映射参数
  const result: ToolArguments = {};
  propNames.forEach((prop, i) => {
    if (args[i] !== undefined) {
      result[prop] = args[i];
    }
  });
  return result;
}

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
    // What: Replace readWsFile with readWsFileAsync.
    // Why: To avoid blocking the Node.js event loop during concurrent LLM requests.
    // Impact: Improves concurrency and responsiveness when handling multiple tool calls.
    read_file: async ({ path: filePath }) => {
      return {
        content: await readWsFileAsync(workspaceDir, filePath as string),
      };
    },

    /** 写入文件处理器 */
    // What: Replace writeWsFile with writeWsFileAsync.
    // Why: To avoid blocking the Node.js event loop during concurrent LLM requests.
    // Impact: Improves concurrency and responsiveness when handling multiple tool calls.
    write_file: async ({ path: filePath, content }) => {
      await writeWsFileAsync(
        workspaceDir,
        filePath as string,
        content as string,
      );
      return { success: true };
    },

    /** 在沙盒中执行代码处理器 */
    execute_code: async ({ code }, { traceId }) => {
      return await sandboxManager.run(
        { type: "code", content: code as string },
        traceId as string,
      );
    },

    /** 列出目录处理器 */
    list_dir: async ({ path: _dirPath }) => {
      // 简单模拟，实际应用中应使用更复杂的逻辑
      return { files: ["."] };
    },

    /** 搜索 Web 处理器 (需对接外部 API) */
    search_web: async ({ query }) => {
      return { results: `Searching for: ${query}... (API not configured)` };
    },
  };
};
