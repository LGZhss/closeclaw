/**
 * Agent 执行上下文
 */
export interface ExecutionContext {
  /** Group 工作目录 */
  groupFolder: string;
  /** 发送给 LLM 的 prompt */
  prompt: string;
  /** 消息历史（可选） */
  history?: Array<{ role: string; parts: Array<{ text: string }> }>;
}

/**
 * Agent Runner 抽象接口
 * 定义统一的 Agent 执行契约，支持多种执行策略
 */
export interface AgentRunner {
  /**
   * 执行 Agent 任务
   * @param context 执行上下文
   * @returns LLM 响应文本
   */
  execute(context: ExecutionContext): Promise<string>;

  /**
   * 清理资源
   */
  close(): Promise<void>;
}
