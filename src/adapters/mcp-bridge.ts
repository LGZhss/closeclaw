import fs from "fs/promises";
import path from "path";

/**
 * MCP (Model Context Protocol) 桥接器
 * 用于向 Claude Code / Chrome MCP 客户端公开 CloseClaw 的项目上下文。
 */
export class McpBridge {
  private readonly votesDir: string;
  private readonly rulesFile: string;

  constructor() {
    this.votesDir = path.resolve(
      process.env.VOTES_DIR || path.join(process.cwd(), "votes"),
    );
    this.rulesFile = path.resolve(
      process.env.RULES_FILE || path.join(process.cwd(), "RULES.md"),
    );
  }

  /**
   * 暴露项目提案作为 MCP 资源
   */
  async listProposals(): Promise<any[]> {
    try {
      const files: string[] = await fs.readdir(this.votesDir);
      return await Promise.all(
        files
          .filter((f: string) => f.startsWith("proposal-"))
          .map(async (file: string) => {
            const content: string = await fs.readFile(
              path.join(this.votesDir, file),
              "utf8",
            );
            return {
              id: file,
              uri: `file://${path.join(this.votesDir, file)}`,
              title: this.extractTitle(content),
              content: content,
            };
          }),
      );
    } catch (error) {
      console.error("[MCP] Failed to list proposals:", error);
      return [];
    }
  }

  /**
   * 允许插件作为协作主体发起投票
   */
  async castVoteFromPlugin(
    proposalId: string,
    attitude: number,
    comment: string,
  ): Promise<void> {
    console.log(
      `[MCP] Received vote for ${proposalId}: ${attitude} (${comment})`,
    );
    // 实现写入 votes/ 文件的逻辑或调用系统 API
  }

  /**
   * 将当前 RULES.md 作为 MCP Prompt 工具提供
   */
  async getRulesAsPrompt(): Promise<string> {
    try {
      return await fs.readFile(this.rulesFile, "utf8");
    } catch {
      return "Rules file not found.";
    }
  }

  private extractTitle(content: string): string {
    const match = content.match(/^# (.*)/m);
    return match ? match[1] : "Untitled Proposal";
  }
}
