/**
 * LLM 聊天参数
 */
export interface ChatParams {
  /** 系统指令 */
  systemInstruction: string;
  /** 对话历史 */
  history: Array<{ role: string; parts: Array<{ text: string }> }>;
  /** 用户消息 */
  message: string | Array<{ text: string }>;
  /** 工具定义（可选） */
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  /** 优先模型级别 */
  preferredLevel?: "pro" | "flash" | "lite" | "mini";
}

/**
 * LLM 聊天响应
 */
export interface ChatResponse {
  /** 响应文本 */
  text: string;
  /** 函数调用（可选） */
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
}

/**
 * LLM Adapter 抽象类
 * 统一不同 LLM 提供商的调用方式
 */
export abstract class LLMAdapter {
  /**
   * 对话接口
   * @param params 聊天参数
   * @returns 聊天响应
   */
  abstract chat(params: ChatParams): Promise<ChatResponse>;
}
