import { describe, it, expect, vi } from 'vitest';
import { SubjectAdapter, SubjectAction, JulesSubjectAdapter, ClaudeCodeSubjectAdapter } from '../src/adapters/subject-adapter.js';
import { logger } from '../src/logger.js';

class TestSubjectAdapter extends SubjectAdapter {
  constructor(id: string, type: string) {
    super(id, type);
  }

  async pullActions(): Promise<SubjectAction[]> {
    return [{ type: 'proposal', content: 'test content' }];
  }

  async syncContext(context: any): Promise<void> {
    // dummy sync
  }
}

describe('SubjectAdapter', () => {
  it('should construct with id and type properly', () => {
    const adapter = new TestSubjectAdapter('test-id', 'test-type');
    expect(adapter.id).toBe('test-id');
    expect(adapter.type).toBe('test-type');
  });

  it('should be able to pull actions', async () => {
    const adapter = new TestSubjectAdapter('test-id', 'test-type');
    const actions = await adapter.pullActions();
    expect(actions).toEqual([{ type: 'proposal', content: 'test content' }]);
  });

  it('should be able to sync context', async () => {
    const adapter = new TestSubjectAdapter('test-id', 'test-type');
    await expect(adapter.syncContext({ some: 'context' })).resolves.toBeUndefined();
  });
});

describe('JulesSubjectAdapter', () => {
  it('should set type to jules', () => {
    const adapter = new JulesSubjectAdapter('jules-id');
    expect(adapter.id).toBe('jules-id');
    expect(adapter.type).toBe('jules');
  });

  it('should pull actions and return empty array', async () => {
    const adapter = new JulesSubjectAdapter('jules-id');

    // Mock logger.debug to avoid spamming the console
    const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

    const actions = await adapter.pullActions();
    expect(actions).toEqual([]);
    expect(debugSpy).toHaveBeenCalledWith('[JulesAdapter] Pulling external critique from Jules...');

    debugSpy.mockRestore();
  });

  it('should sync context', async () => {
    const adapter = new JulesSubjectAdapter('jules-id');

    const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

    const context = { key: 'value' };
    await adapter.syncContext(context);
    expect(debugSpy).toHaveBeenCalledWith(`[JulesAdapter] Syncing project context to Jules environment... (Context size: ${JSON.stringify(context).length})`);

    debugSpy.mockRestore();
  });
});

describe('ClaudeCodeSubjectAdapter', () => {
  it('should set type to claudecode', () => {
    const adapter = new ClaudeCodeSubjectAdapter('claude-id');
    expect(adapter.id).toBe('claude-id');
    expect(adapter.type).toBe('claudecode');
  });

  it('should pull actions and return empty array', async () => {
    const adapter = new ClaudeCodeSubjectAdapter('claude-id');

    const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

    const actions = await adapter.pullActions();
    expect(actions).toEqual([]);
    expect(debugSpy).toHaveBeenCalledWith('[ClaudeCodeAdapter] Pulling MCP actions...');

    debugSpy.mockRestore();
  });

  it('should sync context', async () => {
    const adapter = new ClaudeCodeSubjectAdapter('claude-id');

    const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

    const context = { data: 123 };
    await adapter.syncContext(context);
    expect(debugSpy).toHaveBeenCalledWith(`[ClaudeCodeAdapter] Pushing context via MCP bridge... (Length: ${JSON.stringify(context).length})`);

    debugSpy.mockRestore();
  });
});
