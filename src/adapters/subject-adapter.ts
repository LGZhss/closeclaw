/**
 * 协作主体 (Subject) 抽象适配器
 * 用于将外部生态集成到 CloseClaw 的投票系统中。
 */
import { logger } from "../logger.js";
export interface SubjectAction {
  type: "proposal" | "vote" | "comment";
  proposalId?: string;
  content: string;
}

export abstract class SubjectAdapter {
  constructor(
    public id: string,
    public type: string,
  ) {}

  /**
   * 拉取该主体的最新行动（如 Jules 的评审意见）
   */
  abstract pullActions(): Promise<SubjectAction[]>;

  /**
   * 将 CloseClaw 的状态同步给该主体
   */
  abstract syncContext(context: any): Promise<void>;
}

/**
 * Jules 适配器示例：将 Jules 的 Critique 逻辑映射为 CloseClaw 投票
 */
export class JulesSubjectAdapter extends SubjectAdapter {
  constructor(id: string) {
    super(id, "jules");
  }

  async pullActions(): Promise<SubjectAction[]> {
    logger.debug(`[JulesAdapter] Pulling external critique from Jules...`);
    return [];
  }

  async syncContext(context: any): Promise<void> {
    // 将 votes/ 下的最新准则与投票状态同步给 Google Jules 上下文
    logger.debug(
      `[JulesAdapter] Syncing project context to Jules environment... (Context size: ${JSON.stringify(context).length})`,
    );
  }
}

/**
 * Claude Code 适配器
 */
export class ClaudeCodeSubjectAdapter extends SubjectAdapter {
  constructor(id: string) {
    super(id, "claudecode");
  }

  async pullActions(): Promise<SubjectAction[]> {
    logger.debug(`[ClaudeCodeAdapter] Pulling MCP actions...`);
    return [];
  }

  async syncContext(context: any): Promise<void> {
    logger.debug(
      `[ClaudeCodeAdapter] Pushing context via MCP bridge... (Length: ${JSON.stringify(context).length})`,
    );
  }
}
