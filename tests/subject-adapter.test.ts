import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JulesSubjectAdapter, ClaudeCodeSubjectAdapter } from '../src/adapters/subject-adapter.js';
import { logger } from '../src/logger.js';

// Mock logger to verify it's being called
vi.mock('../src/logger.js', () => ({
  logger: {
    debug: vi.fn(),
  },
}));

describe('Subject Adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('JulesSubjectAdapter', () => {
    it('should initialize with correct id and type', () => {
      const adapter = new JulesSubjectAdapter('jules-1');
      expect(adapter.id).toBe('jules-1');
      expect(adapter.type).toBe('jules');
    });

    it('pullActions should return an empty array and log', async () => {
      const adapter = new JulesSubjectAdapter('jules-1');
      const actions = await adapter.pullActions();

      expect(actions).toEqual([]);
      expect(logger.debug).toHaveBeenCalledWith('[JulesAdapter] Pulling external critique from Jules...');
    });

    it('syncContext should log the context size', async () => {
      const adapter = new JulesSubjectAdapter('jules-1');
      const context = { foo: 'bar', baz: 123 };

      await adapter.syncContext(context);

      const expectedSize = JSON.stringify(context).length;
      expect(logger.debug).toHaveBeenCalledWith(`[JulesAdapter] Syncing project context to Jules environment... (Context size: ${expectedSize})`);
    });
  });

  describe('ClaudeCodeSubjectAdapter', () => {
    it('should initialize with correct id and type', () => {
      const adapter = new ClaudeCodeSubjectAdapter('claude-1');
      expect(adapter.id).toBe('claude-1');
      expect(adapter.type).toBe('claudecode');
    });

    it('pullActions should return an empty array and log', async () => {
      const adapter = new ClaudeCodeSubjectAdapter('claude-1');
      const actions = await adapter.pullActions();

      expect(actions).toEqual([]);
      expect(logger.debug).toHaveBeenCalledWith('[ClaudeCodeAdapter] Pulling MCP actions...');
    });

    it('syncContext should log the context size', async () => {
      const adapter = new ClaudeCodeSubjectAdapter('claude-1');
      const context = { mcp: true, data: [1, 2, 3] };

      await adapter.syncContext(context);

      const expectedSize = JSON.stringify(context).length;
      expect(logger.debug).toHaveBeenCalledWith(`[ClaudeCodeAdapter] Pushing context via MCP bridge... (Length: ${expectedSize})`);
    });
  });
});
