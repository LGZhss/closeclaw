/**
 * 工具定义集合
 * 统一管理所有 Agent 可用的工具函数描述
 */

export const TOOL_DEFINITIONS = {
  /** 读取文件 */
  read_file: {
    name: "read_file",
    description: "读取指定路径的文件内容",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "相对于工作空间的路径" },
      },
      required: ["path"],
    },
  },
  /** 写入文件 */
  write_file: {
    name: "write_file",
    description: "写入内容到指定路径的文件",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "相对于工作空间的路径" },
        content: { type: "string", description: "要写入的内容" },
      },
      required: ["path", "content"],
    },
  },
  /** 执行代码 */
  execute_code: {
    name: "execute_code",
    description: "在安全沙盒中执行 JavaScript 代码",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string", description: "要执行的 JS 代码" },
      },
      required: ["code"],
    },
  },
  /** 列出目录 */
  list_dir: {
    name: "list_dir",
    description: "列出指定目录下的文件和子目录",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "相对于工作空间的路径" },
      },
      required: ["path"],
    },
  },
  /** 搜索 Web */
  search_web: {
    name: "search_web",
    description: "使用搜索引擎进行实时搜索",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "搜索关键词" },
      },
      required: ["query"],
    },
  },
};

export type ToolArguments = Record<string, unknown>;
export type ToolContext = Record<string, unknown>;
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}
